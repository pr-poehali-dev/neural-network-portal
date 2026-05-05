import json
import os
import psycopg2
import urllib.request
import urllib.error
import random
import base64
import uuid
import boto3

SCHEMA = "t_p97689468_neural_network_porta"

PHOTO_ROULETTE_PROMPTS = [
    "Утреннее кафе в Париже, золотой свет, дымящийся кофе, пустой стул у окна — фотореалистично",
    "Женщина в красном пальто на фоне осеннего парка, портрет, боке, плёночная фотография",
    "Неоновые вывески Токио ночью, отражения в лужах, одинокая фигура с зонтом",
    "Полярное сияние над заснеженным лесом, звёздное небо, голубой и фиолетовый свет",
    "Заброшенная оранжерея, пробивающийся сквозь стекло свет, буйная растительность",
    "Приморская деревня на рассвете, рыболовные лодки, туман, пастельные тона",
    "Интерьер уютной библиотеки, тёплый свет, стеллажи до потолка, кожаное кресло",
    "Диффузный свет заката над горным хребтом, облака, горизонт в оранжевых тонах",
    "Стрит-фуд рынок в Таиланде, яркие огни, пар от блюд, многолюдность, вечер",
    "Молодая девушка читает книгу под дождём у окна, уличные фонари размыты",
    "Средиземноморские ступени с розовыми кустами, белые стены, синие двери, солнце",
    "Профессиональный фотопортрет в студии, мягкий рассеянный свет, чистый фон",
    "Ночная съёмка города с высоты, огни окон небоскрёбов, длинная выдержка",
    "Завтрак на деревянном столе, акай, свежие ягоды, гранола, минимализм, сверху",
    "Закат на пустынном пляже, следы на песке, волны, золотой час",
    "Цветущая сакура в японском саду, пруд с карпами, деревянный мостик",
    "Уличный художник рисует граффити, краска в воздухе, живые цвета",
    "Стекло с каплями дождя, размытые огни на заднем плане, боке"
]

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_by_token(cur, token):
    cur.execute(
        f"SELECT id, email, name, is_admin FROM {SCHEMA}.users WHERE password_hash LIKE %s",
        ("%" + token,)
    )
    return cur.fetchone()

def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

def upload_image_to_s3(image_bytes: bytes, prefix: str = "generated") -> str:
    s3 = get_s3()
    key = f"images/{prefix}/{uuid.uuid4()}.png"
    s3.put_object(Bucket="files", Key=key, Body=image_bytes, ContentType="image/png")
    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    return f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"

SIZE_MAP = {
    "square":    (1024, 1024),
    "portrait":  (768, 1024),
    "landscape": (1024, 768),
    "story":     (576, 1024),
    "wide":      (1280, 720),
}

def call_pollinations_txt2img(prompt: str, size: str = "square") -> bytes:
    import urllib.parse
    w, h = SIZE_MAP.get(size, (1024, 1024))
    encoded = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded}?width={w}&height={h}&model=flux&nologo=true&enhance=false"
    req = urllib.request.Request(url, method="GET")
    req.add_header("User-Agent", "Mozilla/5.0")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read()

def resize_image(image_bytes: bytes, max_size: int = 512) -> bytes:
    """Сжимает изображение до max_size по большей стороне через PIL"""
    from PIL import Image
    import io
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size
    if max(w, h) > max_size:
        ratio = max_size / max(w, h)
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()

def call_cloudflare_img2img(image_bytes: bytes, prompt: str) -> bytes:
    """Редактирование фото через Cloudflare Workers AI (flux-1-schnell-img2img)"""
    import io
    from PIL import Image

    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
    api_token = os.environ.get("CLOUDFLARE_API_TOKEN", "")
    if not account_id or not api_token:
        raise Exception("CLOUDFLARE_ACCOUNT_ID или CLOUDFLARE_API_TOKEN не настроены")

    # Сжимаем до 512x512 (лимит CF img2img)
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img.thumbnail((512, 512), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    image_array = list(buf.getvalue())

    payload = json.dumps({
        "prompt": prompt,
        "image": image_array,
        "strength": 0.75,
        "num_steps": 20,
        "guidance": 7.5,
    }).encode()

    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/runwayml/stable-diffusion-v1-5-img2img"
    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Authorization", f"Bearer {api_token}")
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        print(f"[cloudflare img2img] HTTP {e.code}: {err_body[:1000]}")
        raise Exception(f"Cloudflare HTTP {e.code}: {err_body[:300]}")

    # stable-diffusion-v1-5-img2img возвращает сырые байты PNG
    if raw[:4] == b'\x89PNG' or raw[:2] == b'\xff\xd8':
        print(f"[cloudflare img2img] got raw image: {len(raw)} bytes")
        return raw

    # Или JSON с base64
    try:
        result = json.loads(raw)
        print(f"[cloudflare img2img] response: {str(result)[:300]}")
        if result.get("result") and isinstance(result["result"], str):
            return base64.b64decode(result["result"])
        if result.get("result", {}).get("image"):
            return base64.b64decode(result["result"]["image"])
        raise Exception(f"Cloudflare неожиданный ответ: {str(result)[:200]}")
    except (json.JSONDecodeError, KeyError):
        raise Exception(f"Cloudflare вернул нераспознанный формат: {len(raw)} bytes")

def gemini_generate_slides(topic: str, slides_count: int, ai_text: bool) -> list:
    """Генерирует структуру слайдов карусели через Gemini"""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise Exception("GEMINI_API_KEY не настроен")

    text_instruction = (
        "Для каждого слайда придумай яркий заголовок И полный готовый текст для слайда (2-4 строки, конкретно и ёмко)."
        if ai_text else
        "Для каждого слайда придумай яркий заголовок и краткое описание содержимого (подсказку автору)."
    )
    prompt = (
        f"Создай структуру карусели из {slides_count} слайдов для Instagram на тему: '{topic}'.\n"
        f"{text_instruction}\n"
        f"Для каждого слайда придумай описание визуала на английском (5-10 слов, что нарисовать на фоне).\n"
        f"Верни ТОЛЬКО JSON-массив без markdown:\n"
        f'[{{"slide": 1, "title": "...", "text": "...", "visual_prompt": "..."}}]\n'
        f"Первый слайд — цепляющий крючок. Последний — призыв к действию."
    )
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.8, "maxOutputTokens": 4000}
    }).encode()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="ignore")
        raise Exception(f"Gemini error {e.code}: {err[:300]}")
    raw = data["candidates"][0]["content"]["parts"][0]["text"]
    clean = raw.strip()
    if clean.startswith("```"):
        parts = clean.split("```")
        clean = parts[1] if len(parts) > 1 else clean
        if clean.startswith("json"):
            clean = clean[4:]
        clean = clean.strip()
    return json.loads(clean)


def generate_slide_image_pollinations(visual_prompt: str, style_prompt: str) -> bytes:
    """Генерирует изображение слайда через Pollinations (txt2img)"""
    full_prompt = f"{visual_prompt}, {style_prompt}, high quality, instagram post, no text overlay"
    encoded = urllib.parse.quote(full_prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded}?width=1080&height=1080&model=flux&nologo=true&enhance=false"
    req = urllib.request.Request(url, method="GET")
    req.add_header("User-Agent", "Mozilla/5.0")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read()


def generate_slide_image_with_photo(visual_prompt: str, style_prompt: str, user_image_b64: str) -> bytes:
    """Генерирует изображение слайда с пользовательским фото через CF img2img"""
    from PIL import Image
    import io
    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
    api_token = os.environ.get("CLOUDFLARE_API_TOKEN", "")
    if not account_id or not api_token:
        raise Exception("Cloudflare не настроен")
    img_bytes = base64.b64decode(user_image_b64)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img.thumbnail((512, 512), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    image_array = list(buf.getvalue())
    full_prompt = f"{visual_prompt}, {style_prompt}, instagram carousel, no text"
    payload = json.dumps({
        "prompt": full_prompt,
        "image": image_array,
        "strength": 0.6,
        "num_steps": 20,
        "guidance": 7.5,
    }).encode()
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/runwayml/stable-diffusion-v1-5-img2img"
    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Authorization", f"Bearer {api_token}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="ignore")
        raise Exception(f"CF error {e.code}: {err[:200]}")
    if raw[:4] == b'\x89PNG' or raw[:2] == b'\xff\xd8':
        return raw
    result = json.loads(raw)
    if result.get("result", {}).get("image"):
        return base64.b64decode(result["result"]["image"])
    raise Exception(f"CF img2img неожиданный ответ")


def generate_text_with_openrouter(prompt: str, system: str = "") -> str:
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        return "API ключ не настроен. Обратитесь к администратору."

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    payload = json.dumps({
        "model": "openai/gpt-4o-mini",
        "messages": messages,
        "max_tokens": 2000
    }).encode()

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload, method="POST"
    )
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {api_key}")
    req.add_header("HTTP-Referer", "https://neuralai.poehali.dev")

    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
        return data["choices"][0]["message"]["content"]

def handler(event: dict, context) -> dict:
    """Генерация контента: изображения по промту, редактирование фото, тексты, карусели, сценарии"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Authorization, Authorization",
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

    if method == "GET":
        prompt = random.choice(PHOTO_ROULETTE_PROMPTS)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"prompt": prompt})}

    if method != "POST":
        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Метод не разрешён"})}

    action = body.get("action", "")

    if action == "image-gen":
        prompt = body.get("prompt", "")
        style = body.get("style", "")
        size = body.get("size", "square")
        if not prompt:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажите описание изображения"})}

        full_prompt = f"{prompt}, {style}" if style else prompt
        full_prompt += ", high quality, 8k, photorealistic"

        try:
            image_bytes = call_pollinations_txt2img(full_prompt, size)
            cdn_url = upload_image_to_s3(image_bytes, prefix="generated")
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"image_url": cdn_url, "prompt": full_prompt})}
        except Exception as e:
            error_msg = str(e)
            print(f"[image-gen error] {error_msg}")
            return {"statusCode": 500, "headers": headers, "body": json.dumps({"error": f"Ошибка генерации: {error_msg}"})}

    elif action == "image-edit":
        prompt = body.get("prompt", "")
        image_b64 = body.get("image_base64", "")
        size = body.get("size", "square")
        if not prompt or not image_b64:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажите изображение и описание изменений"})}

        try:
            image_bytes = base64.b64decode(image_b64)
        except Exception:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Неверный формат изображения"})}

        try:
            result_bytes = call_cloudflare_img2img(image_bytes, prompt)
            cdn_url = upload_image_to_s3(result_bytes, prefix="edited")
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"image_url": cdn_url, "prompt": prompt})}
        except Exception as e:
            error_msg = str(e)
            print(f"[image-edit error] {error_msg}")
            return {"statusCode": 500, "headers": headers, "body": json.dumps({"error": f"Ошибка редактирования: {error_msg}"})}

    elif action == "post":
        topic = body.get("topic", "")
        platform = body.get("platform", "Instagram")
        tone = body.get("tone", "вовлекающий")
        system = "Ты — профессиональный копирайтер для социальных сетей. Пиши на русском языке."
        prompt = f"Напиши продающий пост для {platform} на тему: '{topic}'. Тон: {tone}. Добавь эмодзи, хэштеги и призыв к действию."
        result = generate_text_with_openrouter(prompt, system)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"result": result, "type": "post"})}

    elif action == "scenario":
        topic = body.get("topic", "")
        platform = body.get("platform", "Reels")
        duration = body.get("duration", "60 секунд")
        system = "Ты — сценарист вирусного контента для социальных сетей. Пиши на русском языке."
        prompt = f"Напиши детальный сценарий для {platform} на тему: '{topic}'. Длительность: {duration}. Укажи: крючок, основную часть, призыв к действию, советы по съёмке."
        result = generate_text_with_openrouter(prompt, system)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"result": result, "type": "scenario"})}

    elif action == "content-plan":
        niche = body.get("niche", "")
        period = body.get("period", "месяц")
        goals = body.get("goals", "рост подписчиков")
        platforms = body.get("platforms", ["Instagram"])
        platforms_str = ", ".join(platforms) if isinstance(platforms, list) else str(platforms)

        # Генерируем вступление
        intro_system = "Ты — стратег контент-маркетинга. Пиши структурированно, по делу, на русском языке."
        intro_prompt = (
            f"Напиши экспертное вступление к контент-плану для ниши '{niche}' на платформах: {platforms_str}. "
            f"Период: {period}. Цели: {goals}. "
            f"Структура (используй эти заголовки дословно):\n"
            f"1. Почему контент важен для этой ниши (3-4 предложения)\n"
            f"2. Особенности аудитории (3-4 предложения)\n"
            f"3. Что работает лучше всего (3-5 конкретных пунктов)\n"
            f"4. Ключевые метрики для отслеживания (4-5 метрик с пояснением)\n"
            f"5. Советы по публикациям (3-5 практических советов)\n"
            f"Пиши конкретно и практично, без воды."
        )
        intro_text = generate_text_with_openrouter(intro_prompt, intro_system)

        # Генерируем план
        plan_system = (
            "Ты — стратег контент-маркетинга. Отвечай ТОЛЬКО валидным JSON-массивом без лишнего текста, markdown и пояснений. "
            "Каждый элемент — объект со строго с полями: "
            "date (строка даты, например '01.06'), "
            "topic (развёрнутая тема поста — 1-2 предложения, конкретно и цепляюще), "
            "scenario (мини-сценарий: крючок, основная мысль, призыв — 2-3 предложения), "
            "format (один из: Reels/Карусель/Пост/Сторис/Статья/Видео/Shorts), "
            "notes (заметки по съёмке или оформлению), "
            "lifehacks (1-2 лайфхака для охвата и вовлечённости)."
        )
        plan_prompt = (
            f"Создай контент-план на {period} для ниши '{niche}'. "
            f"Платформы: {platforms_str}. Цели: {goals}. "
            f"Верни JSON-массив минимум из 20 объектов, равномерно по платформам. Только JSON."
        )
        raw_result = generate_text_with_openrouter(plan_prompt, plan_system)

        rows = None
        try:
            clean = raw_result.strip()
            if clean.startswith("```"):
                parts = clean.split("```")
                clean = parts[1] if len(parts) > 1 else clean
                if clean.startswith("json"):
                    clean = clean[4:]
                clean = clean.strip()
            rows = json.loads(clean)
        except Exception:
            rows = None

        return {"statusCode": 200, "headers": headers, "body": json.dumps({
            "result": raw_result,
            "intro": intro_text,
            "rows": rows,
            "type": "content_plan"
        })}

    elif action == "carousel":
        # Старый текстовый режим — оставляем для обратной совместимости
        topic = body.get("topic", "")
        slides_count = body.get("slides_count", 7)
        system = "Ты — создатель обучающего контента для Instagram. Пиши на русском языке."
        prompt = f"Создай структуру карусели из {slides_count} слайдов для Instagram на тему: '{topic}'. Для каждого слайда укажи: заголовок (до 8 слов), текст (до 30 слов), визуальное описание. Сделай первый слайд цепляющим."
        result = generate_text_with_openrouter(prompt, system)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"result": result, "type": "carousel"})}

    elif action == "carousel-structure":
        topic = body.get("topic", "")
        slides_count = body.get("slides_count", 7)
        ai_text = body.get("ai_text", True)
        if not topic:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажите тему карусели"})}
        try:
            slides = gemini_generate_slides(topic, slides_count, ai_text)
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"slides": slides})}
        except Exception as e:
            print(f"[carousel-structure error] {e}")
            return {"statusCode": 500, "headers": headers, "body": json.dumps({"error": f"Ошибка генерации структуры: {str(e)}"})}

    elif action == "carousel-image":
        visual_prompt = body.get("visual_prompt", "")
        style_prompt = body.get("style_prompt", "minimalist clean design, soft colors")
        user_image_b64 = body.get("user_image_b64", None)
        slide_index = body.get("slide_index", 0)
        if not visual_prompt:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажите visual_prompt"})}
        try:
            if user_image_b64:
                img_bytes = generate_slide_image_with_photo(visual_prompt, style_prompt, user_image_b64)
            else:
                img_bytes = generate_slide_image_pollinations(visual_prompt, style_prompt)
            cdn_url = upload_image_to_s3(img_bytes, prefix="carousel")
            return {"statusCode": 200, "headers": headers, "body": json.dumps({
                "image_url": cdn_url,
                "slide_index": slide_index
            })}
        except Exception as e:
            print(f"[carousel-image error] slide {slide_index}: {e}")
            return {"statusCode": 500, "headers": headers, "body": json.dumps({"error": f"Ошибка генерации изображения: {str(e)}"})}


    elif action == "profile-analysis":
        niche = body.get("niche", "")
        followers = body.get("followers", 0)
        avg_likes = body.get("avg_likes", 0)
        system = "Ты — эксперт по продвижению в социальных сетях. Пиши на русском языке."
        prompt = f"Проанализируй Instagram профиль: ниша '{niche}', подписчиков: {followers}, среднее количество лайков: {avg_likes}. Дай подробный разбор профиля и пошаговую стратегию продвижения на 30 дней с конкретными действиями."
        result = generate_text_with_openrouter(prompt, system)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"result": result, "type": "profile_analysis"})}

    elif action == "funnel":
        platform = body.get("platform", "Instagram")
        product = body.get("product", "")
        audience = body.get("audience", "")
        system = "Ты — эксперт по продажам и воронкам в социальных сетях. Пиши на русском языке."
        prompt = f"Создай продающую воронку для {platform}: продукт/услуга: '{product}', целевая аудитория: '{audience}'. Укажи: все этапы воронки, типы контента для каждого этапа, скрипты сообщений, точки касания."
        result = generate_text_with_openrouter(prompt, system)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"result": result, "type": "funnel"})}

    elif action == "presentation":
        topic = body.get("topic", "")
        slides_count = body.get("slides_count", 10)
        system = "Ты — профессиональный презентационный дизайнер и копирайтер. Пиши на русском языке."
        prompt = f"Создай структуру презентации из {slides_count} слайдов на тему: '{topic}'. Для каждого слайда: заголовок, ключевые тезисы (до 3), визуальное описание. Первый слайд — обложка."
        result = generate_text_with_openrouter(prompt, system)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"result": result, "type": "presentation"})}

    elif action == "guide":
        topic = body.get("topic", "")
        guide_type = body.get("guide_type", "пошаговый")
        system = "Ты — эксперт-методолог. Пиши на русском языке."
        prompt = f"Создай {guide_type} гайд на тему: '{topic}'. Структура: введение, пошаговые инструкции с деталями, советы, частые ошибки, заключение."
        result = generate_text_with_openrouter(prompt, system)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"result": result, "type": "guide"})}

    elif action == "product-card":
        product_name = body.get("product_name", "")
        features = body.get("features", "")
        price = body.get("price", "")
        system = "Ты — маркетолог маркетплейсов. Пиши на русском языке."
        prompt = f"Создай продающую карточку товара для маркетплейса: '{product_name}', характеристики: {features}, цена: {price}. Напиши: заголовок (с ключевыми словами), описание, bullet-points с преимуществами, SEO-теги."
        result = generate_text_with_openrouter(prompt, system)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"result": result, "type": "product_card"})}

    elif action == "reels-analysis":
        video_description = body.get("video_description", "")
        views = body.get("views", 0)
        likes = body.get("likes", 0)
        comments = body.get("comments", 0)
        system = "Ты — аналитик видео-контента. Пиши на русском языке."
        prompt = f"Проанализируй видео Reels: описание: '{video_description}', просмотры: {views}, лайки: {likes}, комментарии: {comments}. Дай анализ: вовлечённость, что работает, что улучшить, рекомендации по продвижению."
        result = generate_text_with_openrouter(prompt, system)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"result": result, "type": "reels_analysis"})}

    return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Действие не найдено"})}