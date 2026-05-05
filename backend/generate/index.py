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

def call_stability_img2img(image_bytes: bytes, prompt: str, size: str = "square") -> bytes:
    api_key = os.environ.get("STABILITY_API_KEY", "")
    if not api_key:
        raise Exception("STABILITY_API_KEY не настроен")

    boundary = "----FormBoundary" + uuid.uuid4().hex

    def field(name, value):
        return (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
            f"{value}\r\n"
        ).encode()

    def file_field(name, filename, content_type, data):
        return (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n"
        ).encode() + data + b"\r\n"

    body = (
        field("prompt", prompt) +
        field("mode", "image-to-image") +
        field("model", "sd3-large-turbo") +
        field("strength", "0.7") +
        field("output_format", "png") +
        file_field("image", "image.png", "image/png", image_bytes) +
        f"--{boundary}--\r\n".encode()
    )

    req = urllib.request.Request(
        "https://api.stability.ai/v2beta/stable-image/generate/sd3",
        data=body, method="POST"
    )
    req.add_header("Authorization", f"Bearer {api_key}")
    req.add_header("Accept", "image/*")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        print(f"[stability error] {e.code}: {err_body}")
        raise Exception(f"Stability AI error {e.code}: {err_body}")

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
            result_bytes = call_stability_img2img(image_bytes, prompt, size)
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
        system = "Ты — стратег контент-маркетинга. Пиши на русском языке. Отвечай в формате структурированной таблицы."
        prompt = f"Создай контент-план на {period} для ниши '{niche}'. Цели: {goals}. Формат: таблица с колонками: дата, тема, формат, платформа, хэштеги, примечания. Минимум 20 записей."
        result = generate_text_with_openrouter(prompt, system)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"result": result, "type": "content_plan"})}

    elif action == "carousel":
        topic = body.get("topic", "")
        slides_count = body.get("slides_count", 7)
        system = "Ты — создатель обучающего контента для Instagram. Пиши на русском языке."
        prompt = f"Создай структуру карусели из {slides_count} слайдов для Instagram на тему: '{topic}'. Для каждого слайда укажи: заголовок (до 8 слов), текст (до 30 слов), визуальное описание. Сделай первый слайд цепляющим."
        result = generate_text_with_openrouter(prompt, system)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"result": result, "type": "carousel"})}

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