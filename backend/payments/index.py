import json
import os
import uuid
import urllib.request
import urllib.error
import base64
import psycopg2
from datetime import datetime, timedelta

SCHEMA = "t_p97689468_neural_network_porta"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_by_token(cur, token):
    cur.execute(
        f"SELECT id, email, name, is_admin FROM {SCHEMA}.users WHERE password_hash LIKE %s",
        ("%" + token,)
    )
    return cur.fetchone()

def yookassa_request(method: str, path: str, body: dict = None) -> dict:
    shop_id = os.environ.get("YOOKASSA_SHOP_ID", "")
    secret_key = os.environ.get("YOOKASSA_SECRET_KEY", "")
    credentials = base64.b64encode(f"{shop_id}:{secret_key}".encode()).decode()

    url = f"https://api.yookassa.ru/v3/{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Basic {credentials}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Idempotence-Key", str(uuid.uuid4()))

    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())

def handler(event: dict, context) -> dict:
    """Оплата подписок через ЮКассу: создание платежа, webhook активации"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization",
        "Content-Type": "application/json"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")
    query = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    action = body.get("action", "") or query.get("action", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── POST create — создать платёж ──────────────────────────────────
        if method == "POST" and action == "create":
            auth_header = event.get("headers", {}).get("X-Authorization", "")
            token = auth_header.replace("Bearer ", "").strip()
            if not token:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Необходима авторизация"})}

            user = get_user_by_token(cur, token)
            if not user:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Сессия истекла"})}

            user_id, user_email, user_name, _ = user
            plan_slug = body.get("plan_slug", "")
            single_tool_slug = body.get("single_tool_slug")
            return_url = body.get("return_url", "https://neuralai.poehali.dev/pricing?payment=success")

            cur.execute(
                f"SELECT id, name, price, duration_months, description, is_credit_pack, credit_images FROM {SCHEMA}.subscription_plans WHERE slug = %s AND is_active = TRUE",
                (plan_slug,)
            )
            plan = cur.fetchone()
            if not plan:
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Тариф не найден"})}

            plan_id, plan_name, amount, duration_months, description, is_credit_pack, credit_images = plan

            # Проверяем наличие ключей ЮКасса
            shop_id = os.environ.get("YOOKASSA_SHOP_ID", "")
            secret_key = os.environ.get("YOOKASSA_SECRET_KEY", "")

            if not shop_id or not secret_key:
                return {
                    "statusCode": 200,
                    "headers": headers,
                    "body": json.dumps({
                        "demo": True,
                        "message": "ЮКасса не настроена. Добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY.",
                        "plan": plan_name,
                        "amount": amount
                    })
                }

            # Создаём платёж в ЮКассе
            payment_data = {
                "amount": {"value": f"{amount}.00", "currency": "RUB"},
                "confirmation": {"type": "redirect", "return_url": return_url},
                "capture": True,
                "description": f"Подписка {plan_name} — Neural AI",
                "metadata": {
                    "user_id": str(user_id),
                    "plan_slug": plan_slug,
                    "plan_id": str(plan_id),
                    "duration_months": str(duration_months),
                    "single_tool_slug": single_tool_slug or "",
                    "is_credit_pack": "1" if is_credit_pack else "0",
                    "credit_images": str(credit_images or 0),
                },
                "receipt": {
                    "customer": {"email": user_email},
                    "items": [{
                        "description": f"Подписка {plan_name} Neural AI",
                        "quantity": "1.00",
                        "amount": {"value": f"{amount}.00", "currency": "RUB"},
                        "vat_code": 1
                    }]
                }
            }

            try:
                payment_resp = yookassa_request("POST", "payments", payment_data)
            except urllib.error.HTTPError as e:
                err_body = e.read().decode()
                return {"statusCode": 502, "headers": headers, "body": json.dumps({"error": f"Ошибка ЮКассы: {err_body}"})}

            payment_id = payment_resp["id"]
            confirm_url = payment_resp["confirmation"]["confirmation_url"]

            # Сохраняем платёж в БД
            cur.execute(
                f"""INSERT INTO {SCHEMA}.payments (user_id, plan_id, yookassa_payment_id, amount, status, single_tool_slug)
                    VALUES (%s, %s, %s, %s, 'pending', %s)""",
                (user_id, plan_id, payment_id, amount, single_tool_slug)
            )
            conn.commit()

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "payment_id": payment_id,
                    "confirmation_url": confirm_url,
                    "amount": amount,
                    "plan_name": plan_name
                })
            }

        # ── POST webhook — получить уведомление от ЮКассы ────────────────
        elif method == "POST" and action == "webhook":
            event_type = body.get("event", "")
            payment_obj = body.get("object", {})

            if event_type != "payment.succeeded":
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

            yookassa_payment_id = payment_obj.get("id", "")

            # Верифицируем платёж напрямую через ЮКассу
            try:
                verified = yookassa_request("GET", f"payments/{yookassa_payment_id}")
                if verified.get("status") != "succeeded":
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Платёж не подтверждён"})}
                payment_obj = verified
                metadata = verified.get("metadata", {})
            except Exception:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Ошибка проверки платежа"})}

            user_id = int(metadata.get("user_id", 0))
            plan_id = int(metadata.get("plan_id", 0))
            duration_months = int(metadata.get("duration_months", 1))
            single_tool_slug = metadata.get("single_tool_slug") or None
            is_credit_pack = metadata.get("is_credit_pack") == "1"
            credit_images = int(metadata.get("credit_images", 0))

            if not user_id or not plan_id:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Нет метаданных"})}

            # Помечаем платёж как оплаченный
            cur.execute(
                f"UPDATE {SCHEMA}.payments SET status = 'paid', paid_at = NOW() WHERE yookassa_payment_id = %s AND status = 'pending'",
                (yookassa_payment_id,)
            )

            if cur.rowcount == 0:
                conn.commit()
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

            if is_credit_pack and credit_images > 0:
                # Пакет изображений — начисляем credits
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET image_credits = image_credits + %s WHERE id = %s",
                    (credit_images, user_id)
                )
            else:
                # Подписка — создаём запись
                expires_at = datetime.now() + timedelta(days=30 * duration_months)
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.user_subscriptions (user_id, plan_id, expires_at, single_tool_slug)
                        VALUES (%s, %s, %s, %s)""",
                    (user_id, plan_id, expires_at, single_tool_slug or None)
                )
            conn.commit()

            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        # ── GET status?payment_id=xxx — проверить статус платежа ─────────
        elif method == "GET" and action == "status":
            payment_id = query.get("payment_id", "")

            if not payment_id:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "payment_id обязателен"})}

            cur.execute(
                f"SELECT status, paid_at FROM {SCHEMA}.payments WHERE yookassa_payment_id = %s",
                (payment_id,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Платёж не найден"})}

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "status": row[0],
                    "paid_at": row[1].isoformat() if row[1] else None
                })
            }

        # ── GET history — история платежей пользователя ──────────────────
        elif method == "GET" and action == "history":
            auth_header = event.get("headers", {}).get("X-Authorization", "")
            token = auth_header.replace("Bearer ", "").strip()
            if not token:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Необходима авторизация"})}

            user = get_user_by_token(cur, token)
            if not user:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Сессия истекла"})}

            cur.execute(
                f"""SELECT p.id, sp.name, p.amount, p.status, p.created_at, p.paid_at
                    FROM {SCHEMA}.payments p
                    JOIN {SCHEMA}.subscription_plans sp ON sp.id = p.plan_id
                    WHERE p.user_id = %s
                    ORDER BY p.created_at DESC LIMIT 20""",
                (user[0],)
            )
            rows = cur.fetchall()
            payments = []
            for r in rows:
                payments.append({
                    "id": r[0], "plan_name": r[1], "amount": r[2], "status": r[3],
                    "created_at": r[4].isoformat() if r[4] else None,
                    "paid_at": r[5].isoformat() if r[5] else None
                })

            return {"statusCode": 200, "headers": headers, "body": json.dumps({"payments": payments})}

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Маршрут не найден"})}

    finally:
        cur.close()
        conn.close()