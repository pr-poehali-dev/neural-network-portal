import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";

const TOOLS = [
  { icon: "ImagePlus", label: "Генерация изображений", desc: "По промту или смена стиля фото", href: "/tools/image-gen", color: "from-violet-500/20 to-purple-500/20", free: true },
  { icon: "LayoutTemplate", label: "Пост-карусель", desc: "Слайды для Instagram с ИИ", href: "/tools/carousel", color: "from-pink-500/20 to-rose-500/20", free: true },
  { icon: "FileVideo", label: "Аналитика Reels", desc: "Разбор видео и рекомендации", href: "/tools/reels", color: "from-orange-500/20 to-red-500/20" },
  { icon: "Clapperboard", label: "Сценарии", desc: "Сценарии для Reels и TikTok", href: "/tools/scenario", color: "from-yellow-500/20 to-orange-500/20" },
  { icon: "Wand2", label: "Генерация постов", desc: "Продающие посты для соцсетей", href: "/tools/post", color: "from-green-500/20 to-teal-500/20" },
  { icon: "CalendarDays", label: "Контент-план", desc: "Таблица постов на месяц", href: "/tools/content-plan", color: "from-teal-500/20 to-cyan-500/20" },
  { icon: "BarChart3", label: "Анализ профиля", desc: "Стратегия продвижения на месяц", href: "/tools/profile", color: "from-cyan-500/20 to-blue-500/20" },
  { icon: "TrendingUp", label: "Воронки продаж", desc: "Воронки для каждой соцсети", href: "/tools/funnel", color: "from-blue-500/20 to-indigo-500/20" },
  { icon: "Presentation", label: "Презентации", desc: "Структура слайдов с ИИ", href: "/tools/presentation", color: "from-indigo-500/20 to-violet-500/20" },
  { icon: "BookOpen", label: "Гайды и чеклисты", desc: "Красиво оформленные документы", href: "/tools/guide", color: "from-violet-500/20 to-pink-500/20" },
  { icon: "ShoppingBag", label: "Карточки товаров", desc: "Продающие описания для маркетплейсов", href: "/tools/product-card", color: "from-pink-500/20 to-rose-500/20" },
  { icon: "Shuffle", label: "Фото-рулетка", desc: "Случайные промты для крутых фото", href: "/tools/roulette", color: "from-rose-500/20 to-orange-500/20" },
];

const STATS = [
  { value: "12+", label: "ИИ-инструментов" },
  { value: "100%", label: "На русском языке" },
  { value: "1 клик", label: "До результата" },
  { value: "∞", label: "Идей для контента" },
];

export default function Index() {
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />

      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs tag-pill mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 bg-primary rounded-full pulse-neon" />
            НЕЙРОСЕТИ ДЛЯ КОНТЕНТ-МЕЙКЕРОВ
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 animate-slide-up stagger-1 leading-tight">
            Создавай контент<br />
            <span className="neon-text">в 10 раз быстрее</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 mb-10 max-w-2xl mx-auto animate-slide-up stagger-2 leading-relaxed">
            12 ИИ-инструментов для Instagram, TikTok и маркетплейсов. Карусели, сценарии, контент-планы, изображения и многое другое — всё на русском языке.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-3">
            {user ? (
              <Link to="/tools">
                <Button size="lg" className="bg-primary text-black font-semibold text-base px-8 hover:bg-primary/90 h-12">
                  Открыть инструменты
                  <Icon name="ArrowRight" size={18} className="ml-2" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                onClick={() => setAuthOpen(true)}
                className="bg-primary text-black font-semibold text-base px-8 hover:bg-primary/90 h-12"
              >
                Начать бесплатно
                <Icon name="Sparkles" size={18} className="ml-2" />
              </Button>
            )}
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/5 h-12 text-base">
                Посмотреть тарифы
              </Button>
            </Link>
          </div>

          <p className="text-sm text-white/30 mt-4 animate-fade-in stagger-4">
            1 бесплатная генерация изображений + 1 пост-карусель без регистрации кредитной карты
          </p>
        </div>
      </section>

      <section className="py-12 px-4 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-display font-bold neon-text mb-1">{s.value}</div>
              <div className="text-sm text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="tag-pill text-primary/60 mb-2">ВСЕ ИНСТРУМЕНТЫ</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                Что умеет платформа
              </h2>
            </div>
            <Link to="/tools" className="text-primary text-sm hover:text-primary/80 flex items-center gap-1 hidden md:flex">
              Все инструменты <Icon name="ArrowRight" size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {TOOLS.map((tool) => (
              <Link key={tool.href} to={tool.href}>
                <div className={`relative glass card-hover rounded-xl p-5 h-full bg-gradient-to-br ${tool.color} border border-white/5 hover:border-primary/20`}>
                  {tool.free && (
                    <span className="absolute top-3 right-3 tag-pill bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[10px]">
                      БЕСПЛАТНО
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                    <Icon name={tool.icon} size={20} className="text-white/70" />
                  </div>
                  <h3 className="font-display font-bold text-white text-base mb-1">{tool.label}</h3>
                  <p className="text-sm text-white/40">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="tag-pill text-primary/60 mb-4">КАК ЭТО РАБОТАЕТ</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-12">Три шага до результата</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Выбери инструмент", desc: "Открой нужный раздел — пост, карусель, сценарий или генерация изображений", icon: "MousePointer" },
              { step: "02", title: "Введи тему", desc: "Напиши тему или загрузи фото. Система поймёт ваш запрос и создаст контент", icon: "PenLine" },
              { step: "03", title: "Готово!", desc: "Скопируй текст, сохрани изображение или используй сразу для публикации", icon: "CheckCircle" },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="section-number" style={{ fontSize: "clamp(60px,8vw,120px)" }}>{item.step}</div>
                <div className="relative z-10 glass rounded-xl p-6 text-left">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
                    <Icon name={item.icon} size={20} className="text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-white text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-white/40">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-8 md:p-12 text-center border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Icon name="Users" size={28} className="text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Приглашай друзей — получай бонусы
            </h2>
            <p className="text-white/50 mb-8 max-w-2xl mx-auto">
              За каждого приглашённого друга ты получаешь +1 бесплатную генерацию изображения. Делись своей реферальной ссылкой и зарабатывай бонусы.
            </p>
            {user ? (
              <Link to="/referral">
                <Button className="bg-primary text-black font-semibold hover:bg-primary/90">
                  Моя реферальная программа
                  <Icon name="ArrowRight" size={16} className="ml-2" />
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => setAuthOpen(true)}
                className="bg-primary text-black font-semibold hover:bg-primary/90"
              >
                Зарегистрироваться и получить ссылку
              </Button>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold neon-text">NEURAL AI</span>
            <span className="text-white/20 text-sm">— платформа ИИ-инструментов для контента</span>
          </div>
          <div className="flex gap-6 text-sm text-white/30">
            <Link to="/pricing" className="hover:text-white transition-colors">Тарифы</Link>
            <Link to="/catalog" className="hover:text-white transition-colors">Каталог ИИ</Link>
            <Link to="/blog" className="hover:text-white transition-colors">Блог</Link>
          </div>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
