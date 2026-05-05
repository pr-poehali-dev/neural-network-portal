import { useState } from "react";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";

const BLOG_POSTS = [
  {
    id: 1,
    title: "Как создать вирусный Reels за 10 минут с помощью ИИ",
    excerpt: "Пошаговый гайд: от идеи до готового сценария. Используем конвертер текста в сценарий и подбираем хук для первых 3 секунд",
    date: "5 мая 2025",
    readTime: "5 мин",
    tag: "Видео",
    color: "from-orange-500/20 to-red-500/20",
    icon: "Clapperboard",
  },
  {
    id: 2,
    title: "Контент-план с аналитикой: как скачать Excel с тремя вкладками",
    excerpt: "Разбираем новый формат контент-плана: стратегия, план публикаций с колонкой «выполнено» и таблица аналитики с автоподсчётом",
    date: "3 мая 2025",
    readTime: "6 мин",
    tag: "Контент",
    color: "from-teal-500/20 to-cyan-500/20",
    icon: "CalendarDays",
  },
  {
    id: 3,
    title: "Скрипт продаж в Direct: как закрывать возражения «дорого» и «подумаю»",
    excerpt: "Реальные фразы и структура скрипта для Instagram Direct. Генерируем за 30 секунд и адаптируем под свой продукт",
    date: "30 апреля 2025",
    readTime: "7 мин",
    tag: "Продажи",
    color: "from-orange-500/20 to-amber-500/20",
    icon: "MessageSquare",
  },
  {
    id: 4,
    title: "ИИ-аватар за 2 минуты: 12 стилей из одного фото",
    excerpt: "Как загрузить фото и получить аватар в стиле аниме, 3D, киберпанк, деловой портрет и других. Используем для профиля и сторис",
    date: "27 апреля 2025",
    readTime: "4 мин",
    tag: "Визуал",
    color: "from-violet-500/20 to-fuchsia-500/20",
    icon: "UserCircle2",
  },
  {
    id: 5,
    title: "Презентация с картинками за 2 минуты: как работает PPTX-генератор",
    excerpt: "ИИ создаёт структуру слайдов, подбирает уникальные картинки для каждого слайда и собирает PowerPoint-файл. Разбираем 5 стилей оформления",
    date: "24 апреля 2025",
    readTime: "5 мин",
    tag: "Презентации",
    color: "from-indigo-500/20 to-blue-500/20",
    icon: "Presentation",
  },
  {
    id: 6,
    title: "Переупаковщик контента: один текст → 6 форматов за раз",
    excerpt: "Вставляешь статью — получаешь пост, карусель, 3 сторис, email-рассылку, заголовок Дзена и тред Telegram. Как это работает и где применять",
    date: "21 апреля 2025",
    readTime: "4 мин",
    tag: "Контент",
    color: "from-amber-500/20 to-yellow-500/20",
    icon: "RefreshCw",
  },
  {
    id: 7,
    title: "Хэштеги которые работают: как подобрать 30 тегов за минуту",
    excerpt: "Разбираем стратегию хэштегов для Instagram и TikTok: высокочастотные для охвата, нишевые для целевой аудитории, локальные для бизнеса",
    date: "18 апреля 2025",
    readTime: "5 мин",
    tag: "Продвижение",
    color: "from-sky-500/20 to-blue-500/20",
    icon: "Hash",
  },
  {
    id: 8,
    title: "Бренд-кит: почему его нужно заполнить первым делом",
    excerpt: "Объясняем зачем нужен бренд-кит, как он влияет на качество генераций и как ИИ-анализ поможет найти точки роста для вашего бизнеса",
    date: "15 апреля 2025",
    readTime: "6 мин",
    tag: "Брендинг",
    color: "from-green-500/20 to-emerald-500/20",
    icon: "Shield",
  },
  {
    id: 9,
    title: "Рекламные объявления для Яндекс.Директ: что пишет ИИ и что работает",
    excerpt: "Сравниваем объявления написанные вручную и сгенерированные ИИ. Разбираем структуру заголовка, текста и CTA для разных платформ",
    date: "12 апреля 2025",
    readTime: "8 мин",
    tag: "Реклама",
    color: "from-red-500/20 to-rose-500/20",
    icon: "Megaphone",
  },
];

const TAGS = ["Все", "Контент", "Видео", "Продажи", "Визуал", "Реклама", "Брендинг", "Продвижение", "Презентации"];

export default function Blog() {
  const [activeTag, setActiveTag] = useState("Все");

  const filtered = activeTag === "Все"
    ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.tag === activeTag);

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-6xl mx-auto">

        <div className="mb-10">
          <p className="tag-pill text-primary/60 mb-2">БЛОГ</p>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-3">Советы и кейсы</h1>
          <p className="text-white/40 max-w-xl">Обучающие материалы по работе с ИИ для контент-мейкеров, SMM-специалистов и предпринимателей</p>
        </div>

        {/* Фильтры по тегам */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                activeTag === tag
                  ? "bg-primary text-black border-primary"
                  : "bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((post) => (
            <div key={post.id} className="glass card-hover rounded-xl border border-white/5 hover:border-primary/20 overflow-hidden cursor-pointer group">
              <div className={`h-28 bg-gradient-to-br ${post.color} flex items-end justify-between p-4`}>
                <span className="tag-pill bg-black/30 text-white/70 px-2 py-0.5 rounded text-[10px] font-medium">
                  {post.tag}
                </span>
                <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                  <Icon name={post.icon} size={16} className="text-white" />
                </div>
              </div>
              <div className="p-5">
                <h2 className="font-display font-bold text-white text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h2>
                <p className="text-sm text-white/40 mb-4 line-clamp-3 leading-relaxed">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-white/25">
                  <span>{post.date}</span>
                  <div className="flex items-center gap-1">
                    <Icon name="Clock" size={11} />
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Нет результатов */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <Icon name="SearchX" size={32} className="mx-auto mb-3 opacity-50" />
            <p>Статей по этой теме пока нет</p>
          </div>
        )}

        {/* Подписка */}
        <div className="mt-12 glass rounded-xl border border-primary/10 p-6 text-center bg-primary/5">
          <Icon name="Bell" size={24} className="text-primary mx-auto mb-3" />
          <h2 className="text-white font-display font-bold text-lg mb-2">Не пропускай новые статьи</h2>
          <p className="text-sm text-white/40 mb-4">Подпишись и получай лайфхаки по ИИ и контент-маркетингу первым</p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="Твой email"
              className="flex-1 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            />
            <button className="px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm whitespace-nowrap">
              Подписаться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
