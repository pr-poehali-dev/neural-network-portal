import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

type Prompt = {
  id: string;
  category: string;
  title: string;
  prompt: string;
  tool: string;
  toolLabel: string;
  likes: number;
  icon: string;
};

const PROMPTS_LIBRARY: Prompt[] = [
  // --- Посты ---
  {
    id: "post-1",
    category: "Посты",
    title: "История успеха",
    prompt: "Напиши вдохновляющий пост о [тема] для Instagram с личной историей успеха, 3 эмодзи, сильным призывом к действию и хэштегами в конце",
    tool: "/tools/post",
    toolLabel: "Генератор постов",
    likes: 312,
    icon: "Wand2",
  },
  {
    id: "post-2",
    category: "Посты",
    title: "Экспертный пост",
    prompt: "Создай экспертный пост на тему [тема] в нише [ниша]. Используй структуру: крючок → 3 совета с деталями → вывод → вопрос аудитории",
    tool: "/tools/post",
    toolLabel: "Генератор постов",
    likes: 278,
    icon: "Wand2",
  },
  {
    id: "post-3",
    category: "Посты",
    title: "Сторителлинг до/после",
    prompt: "Напиши пост-сторителлинг в формате «до и после» для [ниша]. Опиши трансформацию клиента, эмоции, конкретный результат. Добавь 5 хэштегов",
    tool: "/tools/post",
    toolLabel: "Генератор постов",
    likes: 195,
    icon: "Wand2",
  },
  {
    id: "post-4",
    category: "Посты",
    title: "Продающий пост",
    prompt: "Создай продающий пост для [продукт/услуга] по формуле AIDA: внимание, интерес, желание, действие. Аудитория: [описание]. Без спама и агрессивных продаж",
    tool: "/tools/post",
    toolLabel: "Генератор постов",
    likes: 421,
    icon: "Wand2",
  },
  {
    id: "post-5",
    category: "Посты",
    title: "Мифы и факты",
    prompt: "Напиши пост «5 мифов о [тема]» для Instagram. Каждый миф опровергни фактом с объяснением. Живо, без воды, с юмором",
    tool: "/tools/post",
    toolLabel: "Генератор постов",
    likes: 367,
    icon: "Wand2",
  },
  {
    id: "post-6",
    category: "Посты",
    title: "Закулисье бизнеса",
    prompt: "Напиши пост «один день из жизни» владельца [тип бизнеса]. Покажи закулисье, трудности и маленькие победы. Тон — честный и живой",
    tool: "/tools/post",
    toolLabel: "Генератор постов",
    likes: 143,
    icon: "Wand2",
  },

  // --- Визуал ---
  {
    id: "visual-1",
    category: "Визуал",
    title: "Эстетичный стиль",
    prompt: "Создай описание для генерации изображения в стиле [стиль: минимализм/бохо/лакшери] для аккаунта о [тема]. Освещение мягкое, цветовая палитра пастельная, без текста",
    tool: "/tools/image-gen",
    toolLabel: "Генерация изображений",
    likes: 489,
    icon: "ImagePlus",
  },
  {
    id: "visual-2",
    category: "Визуал",
    title: "Продуктовое фото",
    prompt: "Промт для генерации фото [продукт] на [фон]. Стиль: коммерческая фотография, студийный свет, 4K, белый фон, тени мягкие, акцент на текстуре продукта",
    tool: "/tools/image-gen",
    toolLabel: "Генерация изображений",
    likes: 334,
    icon: "ImagePlus",
  },
  {
    id: "visual-3",
    category: "Визуал",
    title: "Портрет личного бренда",
    prompt: "Создай промт для портретного фото в стиле личного бренда: [профессия], уверенная поза, деловой стиль, естественный свет, городской фон, Canon 85mm f/1.4",
    tool: "/tools/image-gen",
    toolLabel: "Генерация изображений",
    likes: 256,
    icon: "ImagePlus",
  },
  {
    id: "visual-4",
    category: "Визуал",
    title: "Обложка для сторис",
    prompt: "Сгенерируй обложку для Instagram Stories на тему [тема]. Вертикальный формат 9:16, яркий градиент, минималистичная иконка в центре, место для текста сверху",
    tool: "/tools/stories",
    toolLabel: "Генератор сторис",
    likes: 178,
    icon: "ImagePlus",
  },
  {
    id: "visual-5",
    category: "Визуал",
    title: "Мудборд бренда",
    prompt: "Создай описание визуального стиля бренда [ниша]: основные цвета, шрифты, настроение, референсы, что не использовать. Для постановки задачи дизайнеру",
    tool: "/tools/brand-kit",
    toolLabel: "Бренд-кит",
    likes: 302,
    icon: "ImagePlus",
  },
  {
    id: "visual-6",
    category: "Визуал",
    title: "ИИ-аватар",
    prompt: "Промт для ИИ-аватара в деловом стиле: [описание внешности], костюм [цвет], нейтральный фон [цвет], профессиональное освещение, взгляд в камеру, реалистичный портрет",
    tool: "/tools/avatar",
    toolLabel: "ИИ-аватар",
    likes: 415,
    icon: "ImagePlus",
  },

  // --- Бизнес ---
  {
    id: "biz-1",
    category: "Бизнес",
    title: "Воронка продаж",
    prompt: "Создай воронку продаж для [продукт] через Instagram. Аудитория: [описание]. Опиши все этапы: осведомлённость → интерес → решение → покупка. Укажи конкретный контент для каждого этапа",
    tool: "/tools/funnel",
    toolLabel: "Воронки продаж",
    likes: 398,
    icon: "TrendingUp",
  },
  {
    id: "biz-2",
    category: "Бизнес",
    title: "Анализ конкурентов",
    prompt: "Проанализируй конкурентов в нише [ниша]. Найди их слабые места, что они не закрывают у аудитории, как я могу отстроиться и занять свою уникальную позицию",
    tool: "/tools/competitor",
    toolLabel: "Анализ конкурентов",
    likes: 267,
    icon: "TrendingUp",
  },
  {
    id: "biz-3",
    category: "Бизнес",
    title: "Скрипт продаж в Direct",
    prompt: "Напиши скрипт переписки для продажи [услуга] через Direct Instagram. Учти возражения: «дорого», «подумаю», «не сейчас». Тон дружелюбный, без давления",
    tool: "/tools/sale-script",
    toolLabel: "Скрипты продаж",
    likes: 445,
    icon: "TrendingUp",
  },
  {
    id: "biz-4",
    category: "Бизнес",
    title: "Описание для маркетплейса",
    prompt: "Создай продающую карточку товара [название] для Wildberries/Ozon. Включи SEO-заголовок, выгоды в буллетах, описание 500 символов, ключевые слова для поиска",
    tool: "/tools/product-card",
    toolLabel: "Карточки товаров",
    likes: 356,
    icon: "TrendingUp",
  },
  {
    id: "biz-5",
    category: "Бизнес",
    title: "Кейс клиента",
    prompt: "Опиши кейс работы с клиентом [ниша]: проблема → решение → результат в цифрах. Формат: короткий пост + развёрнутая версия для сайта/презентации",
    tool: "/tools/case",
    toolLabel: "Генератор кейсов",
    likes: 189,
    icon: "TrendingUp",
  },
  {
    id: "biz-6",
    category: "Бизнес",
    title: "Email-цепочка",
    prompt: "Создай цепочку из 5 писем для прогрева аудитории перед продажей [продукт]. Аудитория: [описание]. День 1: знакомство, дни 2-4: ценность, день 5: оффер",
    tool: "/tools/email",
    toolLabel: "Email-копирайтинг",
    likes: 223,
    icon: "TrendingUp",
  },

  // --- Видео ---
  {
    id: "video-1",
    category: "Видео",
    title: "Сценарий Reels 30 сек",
    prompt: "Напиши сценарий для Reels на 30 секунд о [тема]. Структура: крючок (3 сек) → основная мысль (20 сек) → призыв к действию (7 сек). Живой разговорный стиль",
    tool: "/tools/scenario",
    toolLabel: "Сценарии",
    likes: 512,
    icon: "Clapperboard",
  },
  {
    id: "video-2",
    category: "Видео",
    title: "Образовательный ролик",
    prompt: "Создай сценарий образовательного видео «Как [действие]» для YouTube/TikTok. 3-5 минут, 5 чётких шагов, примеры, без воды. Аудитория: новички в [нише]",
    tool: "/tools/scenario",
    toolLabel: "Сценарии",
    likes: 387,
    icon: "Clapperboard",
  },
  {
    id: "video-3",
    category: "Видео",
    title: "Трендовый формат",
    prompt: "Напиши сценарий для трендового формата «POV: ты [ситуация]» в нише [ниша]. 15-30 секунд, виральный крючок, музыкальный момент, текст на экране",
    tool: "/tools/scenario",
    toolLabel: "Сценарии",
    likes: 478,
    icon: "Clapperboard",
  },
  {
    id: "video-4",
    category: "Видео",
    title: "Анализ Reels",
    prompt: "Проанализируй мой Reels о [тема], который набрал [N] просмотров и [N] лайков. Почему такой результат? Что улучшить в следующем видео? Дай конкретный план",
    tool: "/tools/reels",
    toolLabel: "Аналитика Reels",
    likes: 201,
    icon: "Clapperboard",
  },
  {
    id: "video-5",
    category: "Видео",
    title: "Экспертное интервью",
    prompt: "Составь 10 вопросов для интервью с экспертом в [нише] для YouTube. Вопросы должны раскрывать личность, давать практическую пользу и вызывать дискуссию",
    tool: "/tools/scenario",
    toolLabel: "Сценарии",
    likes: 156,
    icon: "Clapperboard",
  },
  {
    id: "video-6",
    category: "Видео",
    title: "Распаковка / обзор",
    prompt: "Напиши сценарий видео-обзора [продукт] для Instagram/YouTube. Честный отзыв: плюсы, минусы, для кого подойдёт, личное мнение. Без рекламного тона",
    tool: "/tools/scenario",
    toolLabel: "Сценарии",
    likes: 244,
    icon: "Clapperboard",
  },

  // --- Хэштеги ---
  {
    id: "hash-1",
    category: "Хэштеги",
    title: "Полный набор для ниши",
    prompt: "Придумай 30 хэштегов для [ниша]: 10 высокочастотных (1M+), 10 среднечастотных (100K-1M), 10 нишевых (до 100K). Только релевантные, на русском и английском",
    tool: "/tools/hashtags",
    toolLabel: "Генератор хэштегов",
    likes: 534,
    icon: "Hash",
  },
  {
    id: "hash-2",
    category: "Хэштеги",
    title: "Хэштеги для поста",
    prompt: "Подбери 15 хэштегов для поста на тему [тема] в нише [ниша] для Instagram. Микс из общих и специализированных. Исключи заспамленные теги",
    tool: "/tools/hashtags",
    toolLabel: "Генератор хэштегов",
    likes: 389,
    icon: "Hash",
  },
  {
    id: "hash-3",
    category: "Хэштеги",
    title: "Локальный бизнес",
    prompt: "Создай хэштеги для местного бизнеса [тип] в городе [город]. Включи геотеги, нишевые теги района, теги для привлечения локальной аудитории",
    tool: "/tools/hashtags",
    toolLabel: "Генератор хэштегов",
    likes: 198,
    icon: "Hash",
  },
  {
    id: "hash-4",
    category: "Хэштеги",
    title: "Сезонные хэштеги",
    prompt: "Подбери актуальные хэштеги для [сезон/праздник] в нише [ниша]. Включи трендовые теги момента, которые сейчас в топе",
    tool: "/tools/hashtags",
    toolLabel: "Генератор хэштегов",
    likes: 267,
    icon: "Hash",
  },
  {
    id: "hash-5",
    category: "Хэштеги",
    title: "Для личного бренда",
    prompt: "Создай набор хэштегов для личного бренда [профессия]. Разбей на 3 группы: профессиональные теги, лайфстайл, сообщество. Всего 25 штук",
    tool: "/tools/hashtags",
    toolLabel: "Генератор хэштегов",
    likes: 312,
    icon: "Hash",
  },
  {
    id: "hash-6",
    category: "Хэштеги",
    title: "TikTok хэштеги",
    prompt: "Подбери 20 хэштегов для TikTok на тему [тема]. Учти специфику платформы: FYP-теги, нишевые сообщества, трендовые форматы",
    tool: "/tools/hashtags",
    toolLabel: "Генератор хэштегов",
    likes: 445,
    icon: "Hash",
  },

  // --- Карусели ---
  {
    id: "car-1",
    category: "Карусели",
    title: "Топ ошибок в нише",
    prompt: "Создай карусель из 7 слайдов «Топ ошибок в [нише]» с конкретными советами как их избежать. Слайд 1 — цепляющий заголовок, слайды 2-6 — ошибки, слайд 7 — CTA",
    tool: "/tools/carousel",
    toolLabel: "Пост-карусель",
    likes: 467,
    icon: "LayoutTemplate",
  },
  {
    id: "car-2",
    category: "Карусели",
    title: "Пошаговый гайд",
    prompt: "Сделай карусель-инструкцию «Как [действие] за 5 шагов» для [аудитория]. Каждый слайд — один шаг с иллюстрирующим примером. Последний слайд — итог и призыв",
    tool: "/tools/carousel",
    toolLabel: "Пост-карусель",
    likes: 523,
    icon: "LayoutTemplate",
  },
  {
    id: "car-3",
    category: "Карусели",
    title: "До и после трансформация",
    prompt: "Создай карусель «Трансформация за [период]» в нише [ниша]. Покажи было/стало, процесс изменений, конкретные шаги. 8 слайдов, сторителлинг",
    tool: "/tools/carousel",
    toolLabel: "Пост-карусель",
    likes: 389,
    icon: "LayoutTemplate",
  },
  {
    id: "car-4",
    category: "Карусели",
    title: "Подборка советов",
    prompt: "Сделай карусель «10 советов по [тема]» для сохранения в закладки. Каждый совет на отдельном слайде, коротко и ёмко. Слайд 1 — обещание, последний — бонус",
    tool: "/tools/carousel",
    toolLabel: "Пост-карусель",
    likes: 298,
    icon: "LayoutTemplate",
  },
  {
    id: "car-5",
    category: "Карусели",
    title: "Развеиваем мифы",
    prompt: "Создай карусель «Мифы vs Реальность» в [нише]. 6 слайдов: миф + реальность поочерёдно. Ярко, контрастно, виральный формат",
    tool: "/tools/carousel",
    toolLabel: "Пост-карусель",
    likes: 412,
    icon: "LayoutTemplate",
  },
  {
    id: "car-6",
    category: "Карусели",
    title: "Сравнение вариантов",
    prompt: "Напиши карусель «[Вариант А] vs [Вариант Б]: что выбрать?» для [аудитория]. Объективное сравнение по 5 критериям, вывод, вопрос аудитории",
    tool: "/tools/carousel",
    toolLabel: "Пост-карусель",
    likes: 234,
    icon: "LayoutTemplate",
  },
];

const CATEGORIES = ["Все", "Посты", "Визуал", "Бизнес", "Видео", "Хэштеги", "Карусели"];

const CATEGORY_COLORS: Record<string, string> = {
  "Посты": "bg-green-500/15 text-green-400 border-green-500/20",
  "Визуал": "bg-violet-500/15 text-violet-400 border-violet-500/20",
  "Бизнес": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "Видео": "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "Хэштеги": "bg-pink-500/15 text-pink-400 border-pink-500/20",
  "Карусели": "bg-teal-500/15 text-teal-400 border-teal-500/20",
};

export default function Prompts() {
  const [activeCategory, setActiveCategory] = useState("Все");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return PROMPTS_LIBRARY.filter((p) => {
      const matchCategory = activeCategory === "Все" || p.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [activeCategory, search]);

  const handleCopy = (prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.prompt).then(() => {
      setCopiedId(prompt.id);
      toast.success("Промт скопирован!", { description: prompt.title });
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-28 pb-20">
        {/* Header */}
        <div className="mb-10">
          <p className="tag-pill text-primary/60 mb-3 text-xs tracking-widest uppercase">Готовые промты</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Библиотека промтов
          </h1>
          <p className="text-white/50 text-lg max-w-2xl">
            Проверенные промты для создания контента. Копируй, адаптируй под свою нишу и используй в инструментах.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по промтам..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/40"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  activeCategory === cat
                    ? "bg-primary text-black border-primary"
                    : "bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="text-sm text-white/30 mb-6">
          Найдено: <span className="text-white/60">{filtered.length}</span> промтов
        </p>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((prompt) => (
              <div
                key={prompt.id}
                className="glass border border-white/5 rounded-2xl p-5 flex flex-col hover:border-white/10 transition-colors"
              >
                {/* Top row */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name={prompt.icon} size={17} className="text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          CATEGORY_COLORS[prompt.category] || "bg-white/10 text-white/50 border-white/10"
                        }`}
                      >
                        {prompt.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-sm leading-tight">{prompt.title}</h3>
                  </div>
                </div>

                {/* Prompt text */}
                <p className="text-sm text-white/40 leading-relaxed line-clamp-3 flex-1 mb-4">
                  {prompt.prompt}
                </p>

                {/* Footer */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  {/* Likes */}
                  <div className="flex items-center gap-1.5 text-white/30 text-xs mr-auto">
                    <Icon name="Heart" size={13} />
                    <span>{prompt.likes}</span>
                  </div>

                  {/* Copy button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(prompt)}
                    className="h-8 px-3 text-xs text-white/50 hover:text-white hover:bg-white/10"
                  >
                    <Icon
                      name={copiedId === prompt.id ? "Check" : "Copy"}
                      size={13}
                      className="mr-1.5"
                    />
                    {copiedId === prompt.id ? "Скопировано" : "Копировать"}
                  </Button>

                  {/* Use button */}
                  <Link to={prompt.tool}>
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20"
                      variant="ghost"
                    >
                      {prompt.toolLabel}
                      <Icon name="ArrowRight" size={12} className="ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Icon name="SearchX" size={40} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-lg">Ничего не найдено</p>
            <p className="text-white/25 text-sm mt-1">Попробуй другой запрос или категорию</p>
          </div>
        )}
      </div>
    </div>
  );
}
