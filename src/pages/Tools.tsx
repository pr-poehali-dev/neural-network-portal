import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";

const TOOLS = [
  {
    icon: "ImagePlus",
    label: "Генерация изображений",
    desc: "Создай изображение по промту или измени стиль своего фото",
    href: "/tools/image-gen",
    color: "from-violet-500/20 to-purple-500/20 border-violet-500/20",
    free: true,
    hint: "Начни с описания того, что хочешь увидеть",
  },
  {
    icon: "LayoutTemplate",
    label: "Пост-карусель",
    desc: "Создай структуру карусели для Instagram с текстом слайдов",
    href: "/tools/carousel",
    color: "from-pink-500/20 to-rose-500/20 border-pink-500/20",
    free: true,
    hint: "Укажи тему — получи готовую структуру",
  },
  {
    icon: "FileVideo",
    label: "Аналитика Reels",
    desc: "Разбор видео-контента и рекомендации по улучшению",
    href: "/tools/reels",
    color: "from-orange-500/20 to-red-500/20 border-orange-500/20",
    hint: "Введи описание видео и статистику",
  },
  {
    icon: "Clapperboard",
    label: "Сценарии для видео",
    desc: "Готовые сценарии для Reels, TikTok и YouTube Shorts",
    href: "/tools/scenario",
    color: "from-yellow-500/20 to-orange-500/20 border-yellow-500/20",
    hint: "Укажи тему и длительность видео",
  },
  {
    icon: "Wand2",
    label: "Генерация постов",
    desc: "Продающие посты с хэштегами и призывом к действию",
    href: "/tools/post",
    color: "from-green-500/20 to-teal-500/20 border-green-500/20",
    hint: "Введи тему поста и выбери платформу",
  },
  {
    icon: "CalendarDays",
    label: "Контент-план",
    desc: "Таблица постов на месяц с темами и форматами",
    href: "/tools/content-plan",
    color: "from-teal-500/20 to-cyan-500/20 border-teal-500/20",
    hint: "Опиши нишу — получи полный план",
  },
  {
    icon: "BarChart3",
    label: "Анализ профиля",
    desc: "Подробный разбор и стратегия продвижения на 30 дней",
    href: "/tools/profile",
    color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/20",
    hint: "Введи данные профиля и нишу",
  },
  {
    icon: "TrendingUp",
    label: "Воронки продаж",
    desc: "Продающие воронки для каждой социальной сети",
    href: "/tools/funnel",
    color: "from-blue-500/20 to-indigo-500/20 border-blue-500/20",
    hint: "Укажи продукт и целевую аудиторию",
  },
  {
    icon: "Presentation",
    label: "Презентации",
    desc: "Структура и тексты слайдов для любой темы",
    href: "/tools/presentation",
    color: "from-indigo-500/20 to-violet-500/20 border-indigo-500/20",
    hint: "Введи тему и количество слайдов",
  },
  {
    icon: "BookOpen",
    label: "Гайды и чеклисты",
    desc: "Красиво структурированные обучающие документы",
    href: "/tools/guide",
    color: "from-violet-500/20 to-pink-500/20 border-violet-500/20",
    hint: "Укажи тему и выбери тип документа",
  },
  {
    icon: "ShoppingBag",
    label: "Карточки товаров",
    desc: "Продающие описания для Wildberries, Ozon и других",
    href: "/tools/product-card",
    color: "from-pink-500/20 to-rose-500/20 border-pink-500/20",
    hint: "Введи название и характеристики товара",
  },
  {
    icon: "Shuffle",
    label: "Фото-рулетка",
    desc: "Случайные промты для реалистичных и красивых фото",
    href: "/tools/roulette",
    color: "from-rose-500/20 to-orange-500/20 border-rose-500/20",
    hint: "Нажми — получи идею для крутого фото",
  },
  {
    icon: "Hash",
    label: "Хэштег-анализатор",
    desc: "30 хэштегов по частотности: высокие, средние, нишевые",
    href: "/tools/hashtags",
    color: "from-sky-500/20 to-blue-500/20 border-sky-500/20",
    free: true,
    hint: "Укажи тему — получи готовые хэштеги",
  },
  {
    icon: "UserCircle",
    label: "Шапка профиля",
    desc: "3 варианта bio для Instagram, TikTok, VK, Telegram",
    href: "/tools/bio",
    color: "from-emerald-500/20 to-green-500/20 border-emerald-500/20",
    hint: "Ниша + ключевые слова = идеальная шапка",
  },
  {
    icon: "RefreshCw",
    label: "Переупаковщик контента",
    desc: "Один текст → пост, карусель, сторис, email, тред",
    href: "/tools/repurpose",
    color: "from-amber-500/20 to-yellow-500/20 border-amber-500/20",
    hint: "Вставь текст и выбери нужные форматы",
  },
  {
    icon: "UserCircle2",
    label: "ИИ-аватар бренда",
    desc: "Загрузи фото — получи аватары в 12 стилях: арт, аниме, 3D, киберпанк",
    href: "/tools/avatar",
    color: "from-violet-500/20 to-fuchsia-500/20 border-violet-500/20",
    free: true,
    hint: "Загрузи фото и выбери стили",
  },
  {
    icon: "Smartphone",
    label: "Генератор Stories",
    desc: "Готовый визуал для Instagram Stories с красивым фоном",
    href: "/tools/stories",
    color: "from-pink-500/20 to-purple-500/20 border-pink-500/20",
    hint: "Тема + текст = готовая Stories",
  },
  {
    icon: "Shield",
    label: "Бренд-кит",
    desc: "Заполни один раз — все инструменты знают твой стиль и нишу",
    href: "/tools/brand-kit",
    color: "from-green-500/20 to-emerald-500/20 border-green-500/20",
    hint: "Настрой бренд раз и навсегда",
  },
];

export default function Tools() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="tag-pill text-primary/60 mb-2">ИНСТРУМЕНТЫ</p>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-3">
            Все инструменты
          </h1>
          <p className="text-white/40">Выбери нужный инструмент и создай контент за несколько секунд</p>
        </div>

        {!user && (
          <div className="glass rounded-xl p-4 mb-8 border border-primary/10 flex items-center gap-3">
            <Icon name="Info" size={18} className="text-primary flex-shrink-0" />
            <p className="text-sm text-white/60">
              Некоторые инструменты доступны без регистрации. Для полного доступа —{" "}
              <Link to="/pricing" className="text-primary hover:text-primary/80 underline">
                выбери тариф
              </Link>
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {TOOLS.map((tool) => (
            <Link key={tool.href} to={tool.href}>
              <div className={`relative glass card-hover rounded-xl p-5 h-full bg-gradient-to-br ${tool.color} border hover:border-primary/30`}>
                {tool.free && (
                  <span className="absolute top-3 right-3 tag-pill bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[10px]">
                    БЕСПЛАТНО
                  </span>
                )}
                <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center mb-4">
                  <Icon name={tool.icon} size={20} className="text-white/80" />
                </div>
                <h3 className="font-display font-bold text-white text-base mb-1">{tool.label}</h3>
                <p className="text-sm text-white/40 mb-3">{tool.desc}</p>
                <div className="flex items-center gap-1 text-xs text-white/20">
                  <Icon name="Lightbulb" size={11} />
                  <span>{tool.hint}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}