import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime, timedelta

SCHEMA = "t_p97689468_neural_network_porta"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    salt = "neuralai_salt_2024"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def generate_token(user_id: int) -> str:
    return hashlib.sha256(f"{user_id}_{secrets.token_hex(16)}".encode()).hexdigest()

def handler(event: dict, context) -> dict:
    """Авторизация и регистрация пользователей"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, Authorization, X-Authorization",
        "Content-Type": "application/json"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    try:
        conn = get_conn()
    except Exception as e:
        return {"statusCode": 500, "headers": headers, "body": json.dumps({"error": f"Ошибка соединения с БД: {str(e)}"})}

    cur = conn.cursor()

    try:
        if method == "POST" and path.endswith("/register"):
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            name = body.get("name", "").strip()
            ref_code = body.get("ref_code", "").strip()

            if not email or not password:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Email и пароль обязательны"})}

            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
            if cur.fetchone():
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Email уже зарегистрирован"})}

            referrer_id = None
            if ref_code:
                cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE referral_code = %s", (ref_code,))
                row = cur.fetchone()
                if row:
                    referrer_id = row[0]

            new_ref_code = secrets.token_hex(8)
            pw_hash = hash_password(password)

            cur.execute(
                f"""INSERT INTO {SCHEMA}.users (email, password_hash, name, referral_code, referred_by)
                    VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (email, pw_hash, name or email.split("@")[0], new_ref_code, referrer_id)
            )
            user_id = cur.fetchone()[0]

            if referrer_id:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.referrals (referrer_id, referred_id) VALUES (%s, %s)",
                    (referrer_id, user_id)
                )
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET bonus_generations = bonus_generations + 1 WHERE id = %s",
                    (referrer_id,)
                )

            token = generate_token(user_id)
            cur.execute(
                f"UPDATE {SCHEMA}.users SET password_hash = %s WHERE id = %s",
                (pw_hash + "|token:" + token, user_id)
            )
            conn.commit()

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "success": True,
                    "user": {"id": user_id, "email": email, "name": name or email.split("@")[0], "referral_code": new_ref_code, "is_admin": False},
                    "token": token
                })
            }

        elif method == "POST" and path.endswith("/login"):
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            pw_hash = hash_password(password)

            cur.execute(
                f"SELECT id, email, name, referral_code, is_admin, bonus_generations, free_image_generations, free_carousel_generations FROM {SCHEMA}.users WHERE email = %s AND password_hash LIKE %s",
                (email, pw_hash + "%")
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Неверный email или пароль"})}

            user_id, user_email, user_name, ref_code, is_admin, bonus, free_img, free_car = row
            token = generate_token(user_id)
            cur.execute(
                f"UPDATE {SCHEMA}.users SET password_hash = %s WHERE id = %s",
                (pw_hash + "|token:" + token, user_id)
            )

            cur.execute(
                f"""SELECT sp.name, sp.slug, us.expires_at, us.single_tool_slug, sp.is_unlimited, sp.generations_per_tool
                    FROM {SCHEMA}.user_subscriptions us
                    JOIN {SCHEMA}.subscription_plans sp ON sp.id = us.plan_id
                    WHERE us.user_id = %s AND us.is_active = TRUE AND (us.expires_at IS NULL OR us.expires_at > NOW())
                    ORDER BY us.started_at DESC LIMIT 1""",
                (user_id,)
            )
            sub_row = cur.fetchone()
            subscription = None
            if sub_row:
                subscription = {
                    "plan_name": sub_row[0], "plan_slug": sub_row[1],
                    "expires_at": sub_row[2].isoformat() if sub_row[2] else None,
                    "single_tool_slug": sub_row[3], "is_unlimited": sub_row[4],
                    "generations_per_tool": sub_row[5]
                }

            conn.commit()
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "success": True,
                    "user": {
                        "id": user_id, "email": user_email, "name": user_name,
                        "referral_code": ref_code, "is_admin": is_admin,
                        "bonus_generations": bonus, "free_image_generations": free_img,
                        "free_carousel_generations": free_car, "subscription": subscription
                    },
                    "token": token
                })
            }

        elif method == "GET" and path.endswith("/me"):
            auth_header = event.get("headers", {}).get("X-Authorization", "")
            token = auth_header.replace("Bearer ", "").strip()
            if not token:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}

            cur.execute(
                f"SELECT id, email, name, referral_code, is_admin, bonus_generations, free_image_generations, free_carousel_generations FROM {SCHEMA}.users WHERE password_hash LIKE %s",
                ("%" + token,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Сессия истекла"})}

            user_id, user_email, user_name, ref_code, is_admin, bonus, free_img, free_car = row

            cur.execute(
                f"""SELECT sp.name, sp.slug, us.expires_at, us.single_tool_slug, sp.is_unlimited, sp.generations_per_tool
                    FROM {SCHEMA}.user_subscriptions us
                    JOIN {SCHEMA}.subscription_plans sp ON sp.id = us.plan_id
                    WHERE us.user_id = %s AND us.is_active = TRUE AND (us.expires_at IS NULL OR us.expires_at > NOW())
                    ORDER BY us.started_at DESC LIMIT 1""",
                (user_id,)
            )
            sub_row = cur.fetchone()
            subscription = None
            if sub_row:
                subscription = {
                    "plan_name": sub_row[0], "plan_slug": sub_row[1],
                    "expires_at": sub_row[2].isoformat() if sub_row[2] else None,
                    "single_tool_slug": sub_row[3], "is_unlimited": sub_row[4],
                    "generations_per_tool": sub_row[5]
                }

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "user": {
                        "id": user_id, "email": user_email, "name": user_name,
                        "referral_code": ref_code, "is_admin": is_admin,
                        "bonus_generations": bonus, "free_image_generations": free_img,
                        "free_carousel_generations": free_car, "subscription": subscription
                    }
                })
            }

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Маршрут не найден"})}

    except Exception as e:
        conn.rollback()
        return {"statusCode": 500, "headers": headers, "body": json.dumps({"error": str(e)})}
    finally:
        cur.close()
        conn.close()