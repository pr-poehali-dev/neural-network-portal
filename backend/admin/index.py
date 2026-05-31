import json
import os
import psycopg2
from datetime import datetime, timedelta

SCHEMA = "t_p97689468_neural_network_porta"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_admin_user(cur, token):
    cur.execute(
        f"SELECT id, email, name, is_admin FROM {SCHEMA}.users WHERE password_hash LIKE %s AND is_admin = TRUE",
        ("%" + token,)
    )
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Административная панель: управление пользователями, подписками и контентом"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Authorization, Authorization",
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

    auth_header = event.get("headers", {}).get("X-Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()

    conn = get_conn()
    cur = conn.cursor()

    try:
        admin = get_admin_user(cur, token)
        if not admin:
            return {"statusCode": 403, "headers": headers, "body": json.dumps({"error": "Доступ запрещён"})}

        if method == "GET" and action == "stats":
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users")
            total_users = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.user_subscriptions WHERE is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())")
            active_subs = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tool_generations")
            total_gens = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.referrals")
            total_refs = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE created_at > NOW() - INTERVAL '7 days'")
            new_users_week = cur.fetchone()[0]
            cur.execute(f"SELECT COALESCE(SUM(amount), 0) FROM {SCHEMA}.payments WHERE status = 'paid'")
            total_revenue = cur.fetchone()[0]

            return {"statusCode": 200, "headers": headers, "body": json.dumps({
                "total_users": total_users, "active_subscriptions": active_subs,
                "total_generations": total_gens, "total_referrals": total_refs,
                "new_users_week": new_users_week, "total_revenue": total_revenue
            })}

        elif method == "GET" and action == "users":
            search = query.get("search", "")
            where = "WHERE 1=1"
            params = []
            if search:
                where += " AND (u.email ILIKE %s OR u.name ILIKE %s)"
                params.extend([f"%{search}%", f"%{search}%"])

            sql = f"""
                SELECT
                    u.id, u.email, u.name, u.is_admin,
                    u.image_credits, u.bonus_generations, u.created_at,
                    (SELECT sp.name FROM {SCHEMA}.user_subscriptions us
                        JOIN {SCHEMA}.subscription_plans sp ON sp.id = us.plan_id
                        WHERE us.user_id = u.id AND us.is_active = TRUE
                          AND (us.expires_at IS NULL OR us.expires_at > NOW())
                        ORDER BY us.started_at DESC LIMIT 1) AS subscription,
                    (SELECT COUNT(*) FROM {SCHEMA}.tool_generations tg
                        WHERE tg.user_id = u.id AND tg.tool_slug IN ('image-gen', 'image-edit')) AS img_gens,
                    (SELECT COALESCE(SUM(p.amount), 0) FROM {SCHEMA}.payments p
                        WHERE p.user_id = u.id AND p.status = 'paid') AS total_paid,
                    (SELECT COUNT(*) FROM {SCHEMA}.payments p
                        WHERE p.user_id = u.id AND p.status = 'paid') AS paid_count
                FROM {SCHEMA}.users u
                {where}
                ORDER BY u.created_at DESC LIMIT 100
            """
            cur.execute(sql, params)
            rows = cur.fetchall()
            users = []
            for r in rows:
                users.append({
                    "id": r[0], "email": r[1], "name": r[2], "is_admin": r[3],
                    "image_credits": r[4] or 0, "bonus_generations": r[5],
                    "created_at": r[6].isoformat() if r[6] else None,
                    "subscription": r[7],
                    "img_gens": r[8], "total_paid": r[9], "paid_count": r[10]
                })
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"users": users})}

        elif method == "POST" and action == "grant-access":
            user_id = body.get("user_id")
            plan_slug = body.get("plan_slug", "unlimited_month")
            months = body.get("months", 1)

            if not user_id:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "user_id обязателен"})}

            cur.execute(f"SELECT id FROM {SCHEMA}.subscription_plans WHERE slug = %s", (plan_slug,))
            plan = cur.fetchone()
            if not plan:
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Тариф не найден"})}

            expires = datetime.now() + timedelta(days=30 * months)
            cur.execute(
                f"""INSERT INTO {SCHEMA}.user_subscriptions (user_id, plan_id, expires_at, granted_by_admin)
                    VALUES (%s, %s, %s, TRUE)""",
                (user_id, plan[0], expires)
            )
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"success": True, "message": "Доступ предоставлен"})}

        elif method == "POST" and action == "make-admin":
            target_user_id = body.get("user_id")
            if not target_user_id:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "user_id обязателен"})}
            cur.execute(f"UPDATE {SCHEMA}.users SET is_admin = TRUE WHERE id = %s", (target_user_id,))
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"success": True})}

        elif method == "POST" and action == "setup-founder":
            founder_email = body.get("email", "").strip().lower()
            if not founder_email:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "email обязателен"})}

            cur.execute(f"UPDATE {SCHEMA}.users SET is_admin = TRUE WHERE email = %s RETURNING id", (founder_email,))
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Пользователь не найден"})}

            founder_id = row[0]
            cur.execute(f"SELECT id FROM {SCHEMA}.subscription_plans WHERE slug = 'unlimited_year'")
            plan = cur.fetchone()
            if plan:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.user_subscriptions (user_id, plan_id, granted_by_admin) VALUES (%s, %s, TRUE)",
                    (founder_id, plan[0])
                )
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"success": True, "message": "Основатель настроен, безлимитный доступ предоставлен"})}

        elif method == "GET" and action == "generations":
            cur.execute(
                f"""SELECT g.id, g.tool_slug, g.prompt, g.result_url, g.created_at, u.email, u.name
                    FROM {SCHEMA}.tool_generations g
                    JOIN {SCHEMA}.users u ON u.id = g.user_id
                    ORDER BY g.created_at DESC LIMIT 100"""
            )
            rows = cur.fetchall()
            gens = []
            for r in rows:
                gens.append({
                    "id": r[0], "tool_slug": r[1], "prompt": r[2], "result_url": r[3],
                    "created_at": r[4].isoformat() if r[4] else None,
                    "user_email": r[5], "user_name": r[6]
                })
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"generations": gens})}

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Маршрут не найден"})}

    finally:
        cur.close()
        conn.close()