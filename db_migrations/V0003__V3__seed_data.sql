INSERT INTO subscription_plans (name, slug, price, generations_per_tool, is_unlimited, duration_months, description, is_single_tool) VALUES
('Старт', 'start_3', 399, 3, FALSE, 1, '3 генерации по каждому инструменту', FALSE),
('Базовый', 'basic_5', 899, 5, FALSE, 1, '5 генераций по каждому инструменту', FALSE),
('Продвинутый', 'advanced_10', 1499, 10, FALSE, 1, '10 генераций по каждому инструменту', FALSE),
('Безлимит', 'unlimited_month', 2999, NULL, TRUE, 1, 'Безлимитные генерации на 1 месяц', FALSE),
('Один инструмент', 'single_tool', 444, 15, FALSE, 1, '15 генераций на 1 выбранный инструмент', TRUE),
('Безлимит 1 инструмент', 'single_tool_unlimited', 1934, NULL, TRUE, 1, 'Безлимит генераций на 1 инструмент', TRUE),
('Безлимит 3 месяца', 'unlimited_3m', 6999, NULL, TRUE, 3, 'Безлимит всех инструментов на 3 месяца', FALSE),
('Безлимит 6 месяцев', 'unlimited_6m', 12000, NULL, TRUE, 6, 'Безлимит всех инструментов на 6 месяцев', FALSE),
('Безлимит 1 год', 'unlimited_year', 20000, NULL, TRUE, 12, 'Безлимит всех инструментов на 1 год', FALSE);

INSERT INTO ai_tools_catalog (name, slug, description, category, pricing_type, rating, is_featured, tags, capabilities) VALUES
('DALL-E 3', 'dalle3', 'Генерация изображений от OpenAI с фотореалистичным качеством', 'Изображения', 'Freemium', 4.8, TRUE, ARRAY['изображения', 'OpenAI', 'креатив'], ARRAY['text-to-image', 'editing']),
('Midjourney', 'midjourney', 'Художественная генерация изображений высокого качества', 'Изображения', 'Платный', 4.9, TRUE, ARRAY['изображения', 'арт', 'дизайн'], ARRAY['text-to-image', 'style-transfer']),
('Stable Diffusion', 'stable-diffusion', 'Открытая модель для генерации изображений', 'Изображения', 'Бесплатный', 4.5, FALSE, ARRAY['изображения', 'open-source'], ARRAY['text-to-image', 'img2img']),
('ChatGPT', 'chatgpt', 'Генерация текста, постов и сценариев', 'Текст', 'Freemium', 4.9, TRUE, ARRAY['текст', 'контент', 'GPT'], ARRAY['text-generation', 'scripts']),
('Claude', 'claude', 'ИИ-помощник для создания текстового контента', 'Текст', 'Freemium', 4.8, FALSE, ARRAY['текст', 'анализ', 'контент'], ARRAY['text-generation', 'analysis']),
('Runway ML', 'runway', 'Создание и редактирование видео с помощью ИИ', 'Видео', 'Freemium', 4.6, TRUE, ARRAY['видео', 'редактирование', 'ИИ'], ARRAY['video-generation', 'editing']),
('Google Veo', 'google-veo', 'Генерация видео от Google', 'Видео', 'Бесплатный', 4.4, FALSE, ARRAY['видео', 'Google'], ARRAY['video-generation']),
('Canva AI', 'canva-ai', 'Дизайн с ИИ для социальных сетей', 'Дизайн', 'Freemium', 4.7, TRUE, ARRAY['дизайн', 'соцсети', 'шаблоны'], ARRAY['design', 'templates']),
('Suno AI', 'suno', 'Генерация музыки и звука с помощью ИИ', 'Аудио', 'Freemium', 4.5, FALSE, ARRAY['музыка', 'аудио', 'звук'], ARRAY['music-generation']),
('Perplexity', 'perplexity', 'ИИ-поисковик с актуальными данными', 'Поиск', 'Freemium', 4.6, FALSE, ARRAY['поиск', 'аналитика', 'данные'], ARRAY['search', 'research']);
