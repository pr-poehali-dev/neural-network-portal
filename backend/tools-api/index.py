import json
import os
import psycopg2

SCHEMA = "t_p97689468_neural_network_porta"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_by_token(cur, token):
    cur.execute(
        f"SELECT id, email, name, is_admin, bonus_generations, free_image_generations, free_carousel_generations FROM {SCHEMA}.users WHERE password_hash LIKE %s",
        ("%" + token,)
    )
    return cur.fetchone()

def get_user_subscription(cur, user_id):
    cur.execute(
        f"""SELECT sp.slug, sp.is_unlimited, sp.generations_per_tool, sp.is_single_tool, us.single_tool_slug, us.expires_at, us.granted_by_admin
            FROM {SCHEMA}.user_subscriptions us
            JOIN {SCHEMA}.subscription_plans sp ON sp.id = us.plan_id
            WHERE us.user_id = %s AND us.is_active = TRUE AND (us.expires_at IS NULL OR us.expires_at > NOW())
            ORDER BY us.started_at DESC LIMIT 1""",
        (user_id,)
    )
    return cur.fetchone()

def count_generations(cur, user_id, tool_slug):
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.tool_generations WHERE user_id = %s AND tool_slug = %s",
        (user_id, tool_slug)
    )
    return cur.fetchone()[0]

def handler(event: dict, context) -> dict:
    """API для работы с инструментами: проверка лимитов, сохранение генераций, каталог"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Authorization",
        "Content-Type": "application/json"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    query = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    auth_header = event.get("headers", {}).get("X-Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == "GET" and path.endswith("/catalog"):
            category = query.get("category", "")
            pricing = query.get("pricing", "")
            search = query.get("search", "")
            sort = query.get("sort", "rating")

            sql = f"SELECT id, name, slug, description, category, pricing_type, logo_url, website_url, rating, votes, is_featured, tags, capabilities FROM {SCHEMA}.ai_tools_catalog WHERE 1=1"
            params = []
            if category:
                sql += " AND category = %s"
                params.append(category)
            if pricing:
                sql += " AND pricing_type = %s"
                params.append(pricing)
            if search:
                sql += " AND (name ILIKE %s OR description ILIKE %s)"
                params.extend([f"%{search}%", f"%{search}%"])

            order_map = {"rating": "rating DESC", "votes": "votes DESC", "name": "name ASC"}
            sql += f" ORDER BY {order_map.get(sort, 'rating DESC')}"
            cur.execute(sql, params)
            rows = cur.fetchall()
            tools = []
            for r in rows:
                tools.append({
                    "id": r[0], "name": r[1], "slug": r[2], "description": r[3],
                    "category": r[4], "pricing_type": r[5], "logo_url": r[6],
                    "website_url": r[7], "rating": float(r[8]) if r[8] else 0,
                    "votes": r[9], "is_featured": r[10], "tags": r[11] or [], "capabilities": r[12] or []
                })
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"tools": tools})}

        elif method == "POST" and path.endswith("/check-limit"):
            if not token:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Необходима авторизация"})}

            user = get_user_by_token(cur, token)
            if not user:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Сессия истекла"})}

            user_id, _, _, is_admin, bonus, free_img, free_car = user
            tool_slug = body.get("tool_slug", "")

            if is_admin:
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"allowed": True, "reason": "admin"})}

            sub = get_user_subscription(cur, user_id)
            if sub:
                slug, is_unlimited, gen_per_tool, is_single_tool, single_slug, expires_at, granted_by_admin = sub
                if is_unlimited:
                    if is_single_tool and single_slug and single_slug != tool_slug:
                        return {"statusCode": 200, "headers": headers, "body": json.dumps({"allowed": False, "reason": "wrong_tool"})}
                    else:
                        return {"statusCode": 200, "headers": headers, "body": json.dumps({"allowed": True, "reason": "subscription_unlimited"})}
                else:
                    if is_single_tool and single_slug and single_slug != tool_slug:
                        return {"statusCode": 200, "headers": headers, "body": json.dumps({"allowed": False, "reason": "wrong_tool"})}
                    else:
                        used = count_generations(cur, user_id, tool_slug)
                        if used < gen_per_tool:
                            return {"statusCode": 200, "headers": headers, "body": json.dumps({"allowed": True, "remaining": gen_per_tool - used, "reason": "subscription"})}

            if tool_slug == "image-gen" and free_img > 0:
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"allowed": True, "remaining": free_img, "reason": "free_trial"})}
            if tool_slug == "carousel" and free_car > 0:
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"allowed": True, "remaining": free_car, "reason": "free_trial"})}

            if bonus > 0 and tool_slug == "image-gen":
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"allowed": True, "remaining": bonus, "reason": "bonus"})}

            return {"statusCode": 200, "headers": headers, "body": json.dumps({"allowed": False, "reason": "limit_exceeded"})}

        elif method == "POST" and path.endswith("/save-generation"):
            if not token:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Необходима авторизация"})}

            user = get_user_by_token(cur, token)
            if not user:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Сессия истекла"})}

            user_id = user[0]
            is_admin = user[3]
            free_img = user[5]
            free_car = user[6]
            tool_slug = body.get("tool_slug", "")
            prompt = body.get("prompt", "")
            result_url = body.get("result_url", "")
            result_data = body.get("result_data", {})

            cur.execute(
                f"INSERT INTO {SCHEMA}.tool_generations (user_id, tool_slug, prompt, result_url, result_data) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (user_id, tool_slug, prompt, result_url, json.dumps(result_data))
            )
            gen_id = cur.fetchone()[0]

            if not is_admin:
                if tool_slug == "image-gen" and free_img > 0:
                    cur.execute(f"UPDATE {SCHEMA}.users SET free_image_generations = free_image_generations - 1 WHERE id = %s", (user_id,))
                elif tool_slug == "carousel" and free_car > 0:
                    cur.execute(f"UPDATE {SCHEMA}.users SET free_carousel_generations = free_carousel_generations - 1 WHERE id = %s", (user_id,))

            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"success": True, "generation_id": gen_id})}

        elif method == "GET" and path.endswith("/my-generations"):
            if not token:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Необходима авторизация"})}

            user = get_user_by_token(cur, token)
            if not user:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Сессия истекла"})}

            user_id = user[0]
            tool_slug = query.get("tool_slug", "")

            sql = f"SELECT id, tool_slug, prompt, result_url, result_data, created_at FROM {SCHEMA}.tool_generations WHERE user_id = %s"
            params = [user_id]
            if tool_slug:
                sql += " AND tool_slug = %s"
                params.append(tool_slug)
            sql += " ORDER BY created_at DESC LIMIT 50"

            cur.execute(sql, params)
            rows = cur.fetchall()
            generations = []
            for r in rows:
                generations.append({
                    "id": r[0], "tool_slug": r[1], "prompt": r[2],
                    "result_url": r[3], "result_data": r[4],
                    "created_at": r[5].isoformat() if r[5] else None
                })

            return {"statusCode": 200, "headers": headers, "body": json.dumps({"generations": generations})}

        elif method == "GET" and path.endswith("/plans"):
            cur.execute(f"SELECT id, name, slug, price, generations_per_tool, is_unlimited, duration_months, description, is_single_tool FROM {SCHEMA}.subscription_plans WHERE is_active = TRUE ORDER BY price ASC")
            rows = cur.fetchall()
            plans = []
            for r in rows:
                plans.append({
                    "id": r[0], "name": r[1], "slug": r[2], "price": r[3],
                    "generations_per_tool": r[4], "is_unlimited": r[5],
                    "duration_months": r[6], "description": r[7], "is_single_tool": r[8]
                })
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"plans": plans})}

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Маршрут не найден"})}

    finally:
        cur.close()
        conn.close()