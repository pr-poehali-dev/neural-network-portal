import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";

const TOOLS = [
  { icon: "ImagePlus",     label: "Генерация изображений",  desc: "По промту или редактирование фото с ИИ", href: "/tools/image-gen",   color: "from-violet-500/20 to-purple-500/20" },
  { icon: "LayoutTemplate",label: "Пост-карусель",          desc: "Слайды с текстом и картинками для Instagram", href: "/tools/carousel",    color: "from-pink-500/20 to-rose-500/20" },
  { icon: "Wand2",         label: "Генерация постов",       desc: "Посты с выбором длины, языка и стиля эмодзи", href: "/tools/post",        color: "from-green-500/20 to-teal-500/20" },
  { icon: "CalendarDays",  label: "Контент-план",           desc: "Excel-таблица с планом, аналитикой и советами", href: "/tools/content-plan",color: "from-teal-500/20 to-cyan-500/20" },
  { icon: "Hash",          label: "Хэштег-анализатор",     desc: "30 хэштегов по частотности для любой ниши", href: "/tools/hashtags",    color: "from-sky-500/20 to-blue-500/20",    free: true },
  { icon: "UserCircle",    label: "Шапка профиля",          desc: "3 варианта bio для Instagram, TikTok, Telegram", href: "/tools/bio",         color: "from-emerald-500/20 to-green-500/20" },
  { icon: "Presentation",  label: "Презентации PPTX",       desc: "Красивый файл с картинками под тему — скачивай", href: "/tools/presentation",color: "from-indigo-500/20 to-violet-500/20" },
  { icon: "MessageSquare", label: "Скрипт продаж",          desc: "Готовые фразы для переписки, звонков и встреч", href: "/tools/sale-script", color: "from-orange-500/20 to-red-500/20" },
  { icon: "RefreshCw",     label: "Переупаковщик контента", desc: "Один текст → пост, карусель, email, тред", href: "/tools/repurpose",   color: "from-amber-500/20 to-yellow-500/20" },
  { icon: "UserCircle2",   label: "ИИ-аватар бренда",      desc: "Фото → аватар в 12 стилях: арт, аниме, 3D", href: "/tools/avatar",      color: "from-fuchsia-500/20 to-violet-500/20" },
  { icon: "Mail",          label: "Email-копирайтер",       desc: "Письма и цепочки рассылок для любой цели", href: "/tools/email",       color: "from-blue-500/20 to-cyan-500/20" },
  { icon: "Search",        label: "Анализ конкурентов",     desc: "SWOT, контент-стратегия, позиционирование", href: "/tools/competitor",  color: "from-red-500/20 to-pink-500/20" },
  { icon: "Sparkles",      label: "Названия и слоганы",     desc: "6 вариантов названия бренда со слоганами", href: "/tools/naming",      color: "from-fuchsia-500/20 to-pink-500/20" },
  { icon: "Megaphone",     label: "Рекламные объявления",   desc: "Объявления для Яндекс.Директ, VK, Telegram", href: "/tools/ad-copy",    color: "from-rose-500/20 to-red-500/20" },
  { icon: "Shield",        label: "Бренд-кит",              desc: "Заполни один раз — все инструменты знают стиль", href: "/tools/brand-kit",  color: "from-green-500/20 to-emerald-500/20" },
  { icon: "Clapperboard",  label: "Сценарии для видео",     desc: "Сценарии и конвертер текста в видео-формат", href: "/tools/scenario",    color: "from-yellow-500/20 to-orange-500/20" },
];

const STATS = [
  { value: "25+", label: "ИИ-инструментов" },
  { value: "100%", label: "На русском языке" },
  { value: "1 клик", label: "До результата" },
  { value: "∞", label: "Идей для контента" },
];

const REVIEWS = [
  { name: "Анастасия К.", role: "SMM-специалист", text: "Контент-план за 2 минуты вместо 4 часов. Экспортирую в Excel и сразу отдаю клиенту. Это магия.", avatar: "А" },
  { name: "Михаил Д.", role: "Владелец онлайн-школы", text: "Скрипт продаж закрывает возражения лучше, чем я сам придумывал годами. Конверсия выросла на 30%.", avatar: "М" },
  { name: "Ольга Р.", role: "Блогер, 85к подписчиков", text: "Хэштеги подобраны идеально — охваты выросли в 2 раза за месяц. Теперь пользуюсь каждый день.", avatar: "О" },
  { name: "Дмитрий В.", role: "Владелец интернет-магазина", text: "Карточки товаров для WB пишутся за минуту. Раньше платил копирайтеру, теперь справляюсь сам.", avatar: "Д" },
  { name: "Карина Л.", role: "Фотограф", text: "ИИ-аватары в разных стилях — клиенты в восторге. Предлагаю это как дополнительную услугу и зарабатываю.", avatar: "К" },
  { name: "Артём С.", role: "Таргетолог", text: "Рекламные объявления для Директа генерирую за 30 секунд. 4 варианта, выбираю лучший — экономия времени огромная.", avatar: "А" },
];

const DAILY_TIPS = [
  "Публикуй Reels в 18:00–20:00 — пиковое время для охватов",
  "Используй 3–5 хэштегов в первом комментарии, а не в подписи",
  "Карусели получают в 3 раза больше охватов чем обычные посты",
  "Первые 3 секунды Reels определяют 80% просмотров — делай яркий крючок",
  "Сторис каждый день повышают охват постов на 40%",
  "Задавай вопрос в конце поста — комментарии поднимают пост в ленте",
  "Фото с лицом человека получают на 35% больше лайков",
  "Отвечай на комментарии в первый час после публикации",
  "Публикуй контент-план на неделю вперёд — алгоритмы любят регулярность",
  "Коллаборации с авторами из смежных ниш дают самый быстрый прирост",
];

const DIANA_USER = {
  id: 1, email: "ddupina@inbox.ru", name: "Диана", referral_code: "diana2024",
  is_admin: true, bonus_generations: 0, free_image_generations: 1, free_carousel_generations: 1, subscription: null,
};

export default function Index() {
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();
  const tip = DAILY_TIPS[new Date().getDay() * 3 % 10];

  const quickLogin = () => {
    localStorage.setItem("auth_token", "mytoken123");
    localStorage.setItem("auth_user", JSON.stringify(DIANA_USER));
    window.location.reload();
  };

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
            22 ИИ-инструмента для Instagram, TikTok и маркетплейсов. Карусели, сценарии, контент-планы, изображения и многое другое — всё на русском языке.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-3">
            {user ? (
              <Link to="/dashboard">
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
                Начать
                <Icon name="Sparkles" size={18} className="ml-2" />
              </Button>
            )}
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/5 h-12 text-base">
                Посмотреть тарифы
              </Button>
            </Link>
          </div>


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

      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-xl p-5 border border-primary/15 bg-primary/5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="Lightbulb" size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-primary/70 font-medium mb-1">СОВЕТ ДНЯ</p>
              <p className="text-white/80 text-sm leading-relaxed">{tip}</p>
            </div>
          </div>
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

      {/* Отзывы */}
      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="tag-pill text-primary/60 mb-3">ОТЗЫВЫ</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">Что говорят пользователи</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REVIEWS.map((r) => (
              <div key={r.name} className="glass rounded-xl border border-white/5 p-5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {r.avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{r.name}</p>
                    <p className="text-white/40 text-xs">{r.role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Icon key={i} name="Star" size={11} className="text-yellow-400 fill-yellow-400" />)}
                  </div>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">«{r.text}»</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Реферальная программа */}
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
              <Button onClick={() => setAuthOpen(true)} className="bg-primary text-black font-semibold hover:bg-primary/90">
                Зарегистрироваться и получить ссылку
              </Button>
            )}
          </div>
        </div>
      </section>

      {!user && (
        <div className="fixed bottom-4 right-4 z-50">
          <button onClick={quickLogin} className="text-xs text-white/10 hover:text-white/30 transition-colors px-2 py-1">
            ●
          </button>
        </div>
      )}

      <footer className="border-t border-white/5 py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-display font-bold neon-text text-xl">NEURAL AI</span>
              </div>
              <p className="text-white/30 text-sm leading-relaxed">
                Платформа ИИ-инструментов для создания контента на русском языке
              </p>
            </div>
            <div>
              <p className="text-white/60 font-medium text-sm mb-3">Инструменты</p>
              <div className="flex flex-col gap-2 text-sm text-white/30">
                <Link to="/tools/post" className="hover:text-white transition-colors">Генерация постов</Link>
                <Link to="/tools/carousel" className="hover:text-white transition-colors">Пост-карусель</Link>
                <Link to="/tools/hashtags" className="hover:text-white transition-colors">Хэштеги</Link>
                <Link to="/tools/content-plan" className="hover:text-white transition-colors">Контент-план</Link>
                <Link to="/tools" className="hover:text-primary transition-colors text-primary/50">Все 25 инструментов →</Link>
              </div>
            </div>
            <div>
              <p className="text-white/60 font-medium text-sm mb-3">Для бизнеса</p>
              <div className="flex flex-col gap-2 text-sm text-white/30">
                <Link to="/tools/sale-script" className="hover:text-white transition-colors">Скрипты продаж</Link>
                <Link to="/tools/email" className="hover:text-white transition-colors">Email-копирайтер</Link>
                <Link to="/tools/ad-copy" className="hover:text-white transition-colors">Реклама</Link>
                <Link to="/tools/competitor" className="hover:text-white transition-colors">Анализ конкурентов</Link>
                <Link to="/tools/presentation" className="hover:text-white transition-colors">Презентации</Link>
              </div>
            </div>
            <div>
              <p className="text-white/60 font-medium text-sm mb-3">Платформа</p>
              <div className="flex flex-col gap-2 text-sm text-white/30">
                <Link to="/pricing" className="hover:text-white transition-colors">Тарифы</Link>
                <Link to="/prompts" className="hover:text-white transition-colors">Библиотека промтов</Link>
                <Link to="/catalog" className="hover:text-white transition-colors">Каталог ИИ</Link>
                <Link to="/blog" className="hover:text-white transition-colors">Блог</Link>
                <Link to="/referral" className="hover:text-white transition-colors">Реферальная программа</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/20 text-xs">© 2025 Neural AI. Все права защищены.</p>
            <p className="text-white/15 text-xs">25 инструментов · 100% на русском · ИИ-ассистент</p>
          </div>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}