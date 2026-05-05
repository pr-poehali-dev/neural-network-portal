import json
import os
import psycopg2
import urllib.request
import urllib.error
import random

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

def call_huggingface(prompt: str, model: str = "stabilityai/stable-diffusion-xl-base-1.0") -> bytes:
    hf_token = os.environ.get("HUGGINGFACE_TOKEN", "")
    url = f"https://api-inference.huggingface.co/models/{model}"
    payload = json.dumps({"inputs": prompt}).encode()
    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    if hf_token:
        req.add_header("Authorization", f"Bearer {hf_token}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()

def generate_text_with_openrouter(prompt: str, system: str = "") -> str:
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        return "API ключ не настроен. Обратитесь к администратору."

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    payload = json.dumps({
        "model": "mistralai/mistral-7b-instruct:free",
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
    """Генерация контента: изображения, тексты, карусели, сценарии, контент-планы"""
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
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    if method == "GET" and path.endswith("/roulette"):
        prompt = random.choice(PHOTO_ROULETTE_PROMPTS)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"prompt": prompt})}

    if method != "POST":
        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Метод не разрешён"})}

    action = path.split("/")[-1]

    if action == "post":
        topic = body.get("topic", "")
        platform = body.get("platform", "Instagram")
        tone = body.get("tone", "вовлекающий")
        system = f"Ты — профессиональный копирайтер для социальных сетей. Пиши на русском языке."
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
        profile_url = body.get("profile_url", "")
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
        prompt = f"Создай структуру презентации из {slides_count} слайдов на тему: '{topic}'. Для каждого слайда: заголовок, ключевые тезисы (до 3 штук), рекомендация по визуализации."
        result = generate_text_with_openrouter(prompt, system)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"result": result, "type": "presentation"})}

    elif action == "guide":
        topic = body.get("topic", "")
        guide_type = body.get("guide_type", "гайд")
        system = "Ты — эксперт по созданию образовательного контента. Пиши на русском языке."
        prompt = f"Создай подробный {guide_type} на тему: '{topic}'. Структура должна быть красивой, с разделами, подразделами, чеклистами и практическими советами. Добавь введение и заключение."
        result = generate_text_with_openrouter(prompt, system)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"result": result, "type": "guide"})}

    elif action == "product-card":
        product_name = body.get("product_name", "")
        features = body.get("features", "")
        price = body.get("price", "")
        system = "Ты — эксперт по маркетплейсам и продающим текстам. Пиши на русском языке."
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
