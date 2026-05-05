import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";

const BLOG_POSTS = [
  {
    id: 1,
    title: "Как создать вирусный Reels за 10 минут с помощью ИИ",
    excerpt: "Пошаговый гайд: от идеи до готового сценария с использованием нейросетей",
    date: "2 мая 2025",
    readTime: "5 мин",
    tag: "Видео",
    color: "from-orange-500/20 to-red-500/20",
  },
  {
    id: 2,
    title: "Контент-план на месяц: как ИИ заменяет контент-менеджера",
    excerpt: "Реальный кейс: как блогер с 10к подписчиков автоматизировал создание контента",
    date: "29 апреля 2025",
    readTime: "7 мин",
    tag: "Контент",
    color: "from-teal-500/20 to-cyan-500/20",
  },
  {
    id: 3,
    title: "5 промтов для генерации продающих фото в Instagram",
    excerpt: "Разбираем лучшие промты для создания профессиональных изображений для постов",
    date: "25 апреля 2025",
    readTime: "4 мин",
    tag: "Фото",
    color: "from-violet-500/20 to-purple-500/20",
  },
  {
    id: 4,
    title: "Карточки товаров на Wildberries: как ИИ помогает продавать больше",
    excerpt: "Оптимизация описаний, SEO и продающие тексты для маркетплейсов с помощью нейросетей",
    date: "20 апреля 2025",
    readTime: "6 мин",
    tag: "Маркетплейс",
    color: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: 5,
    title: "Анализ профиля Instagram: что смотреть и как расти",
    excerpt: "Метрики, которые важны для роста аккаунта и как их улучшить",
    date: "15 апреля 2025",
    readTime: "8 мин",
    tag: "Аналитика",
    color: "from-blue-500/20 to-indigo-500/20",
  },
  {
    id: 6,
    title: "Реферальная программа: как зарабатывать на приглашениях",
    excerpt: "Как использовать реферальную программу для получения бонусных генераций",
    date: "10 апреля 2025",
    readTime: "3 мин",
    tag: "Бонусы",
    color: "from-green-500/20 to-teal-500/20",
  },
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="tag-pill text-primary/60 mb-2">БЛОГ</p>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-3">Советы и кейсы</h1>
          <p className="text-white/40">Обучающие материалы по работе с ИИ для контент-мейкеров</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BLOG_POSTS.map((post) => (
            <div key={post.id} className={`glass card-hover rounded-xl border border-white/5 hover:border-primary/20 overflow-hidden`}>
              <div className={`h-28 bg-gradient-to-br ${post.color} flex items-end p-4`}>
                <span className="tag-pill bg-black/30 text-white/60 px-2 py-0.5 rounded text-[10px]">
                  {post.tag}
                </span>
              </div>
              <div className="p-5">
                <h2 className="font-display font-bold text-white text-base mb-2 line-clamp-2">{post.title}</h2>
                <p className="text-sm text-white/40 mb-4 line-clamp-2">{post.excerpt}</p>
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

        <div className="mt-10 glass rounded-xl border border-primary/10 p-6 text-center bg-primary/5">
          <Icon name="Bell" size={24} className="text-primary mx-auto mb-3" />
          <h2 className="text-white font-display font-bold text-lg mb-2">Не пропускай новые статьи</h2>
          <p className="text-sm text-white/40 mb-4">Подпишись и получай лайфхаки по ИИ и контент-маркетингу</p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="Твой email"
              className="flex-1 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            />
            <button className="px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm">
              Подписаться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
