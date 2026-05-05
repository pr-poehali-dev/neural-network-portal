import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";
import { toolsApi } from "@/lib/api";
import type { Generation } from "@/lib/api";
import { toast } from "sonner";

// ─── Быстрые инструменты ────────────────────────────────────────────────────

const QUICK_TOOLS = [
  { icon: "Wand2",        label: "Генерация постов",   href: "/tools/post",         color: "from-green-500/20 to-teal-500/20 border-green-500/20" },
  { icon: "LayoutTemplate", label: "Пост-карусель",    href: "/tools/carousel",     color: "from-pink-500/20 to-rose-500/20 border-pink-500/20" },
  { icon: "Hash",          label: "Хэштеги",            href: "/tools/hashtags",     color: "from-sky-500/20 to-blue-500/20 border-sky-500/20" },
  { icon: "CalendarDays",  label: "Контент-план",       href: "/tools/content-plan", color: "from-teal-500/20 to-cyan-500/20 border-teal-500/20" },
  { icon: "ImagePlus",     label: "Изображения",        href: "/tools/image-gen",    color: "from-violet-500/20 to-purple-500/20 border-violet-500/20" },
  { icon: "Presentation",  label: "Презентации",        href: "/tools/presentation", color: "from-indigo-500/20 to-violet-500/20 border-indigo-500/20" },
  { icon: "MessageSquare", label: "Скрипт продаж",      href: "/tools/sale-script",  color: "from-orange-500/20 to-red-500/20 border-orange-500/20" },
  { icon: "UserCircle",    label: "Шапка профиля",      href: "/tools/bio",          color: "from-emerald-500/20 to-green-500/20 border-emerald-500/20" },
];

// ─── Промо-баннеры новых инструментов ───────────────────────────────────────

const PROMO_BANNERS = [
  {
    icon: "Hash",
    label: "Хэштег-анализатор",
    desc: "30 хэштегов по частотности за один клик",
    href: "/tools/hashtags",
    color: "from-sky-500/10 to-blue-500/10 border-sky-500/20",
    iconColor: "text-sky-400",
  },
  {
    icon: "UserCircle",
    label: "Шапка профиля",
    desc: "3 варианта bio для любой соцсети",
    href: "/tools/bio",
    color: "from-emerald-500/10 to-green-500/10 border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: "MessageSquare",
    label: "Скрипт продаж",
    desc: "Скрипты для Direct, звонков и Stories",
    href: "/tools/sale-script",
    color: "from-orange-500/10 to-red-500/10 border-orange-500/20",
    iconColor: "text-orange-400",
  },
];

// ─── Советы дня ─────────────────────────────────────────────────────────────

const TIPS = [
  "Публикуй Reels в 18:00–20:00 — это пиковое время активности аудитории и максимальные охваты.",
  "Используй 3–5 хэштегов в первом комментарии, а не в подписи — так алгоритмы воспринимают их лучше.",
  "Первые 3 секунды видео решают всё: начинай с вопроса или неожиданного факта, чтобы удержать зрителя.",
  "Сохранения важнее лайков — создавай контент «сохрани, чтобы не потерять» с чеклистами и советами.",
  "Отвечай на комментарии в первый час после публикации — это сигнализирует алгоритму об активности.",
  "Чередуй форматы: пост → карусель → видео → сторис. Разнообразие удерживает разные сегменты аудитории.",
  "Один сильный CTA лучше трёх слабых. Попроси подписчиков сделать одно конкретное действие.",
  "Истории каждый день важнее постов каждый день — они держат тебя «живым» в ленте подписчиков.",
  "Используй трендовые звуки для Reels в первые 24–48 часов после их появления в топе.",
  "Карусели получают в 3× больше повторных просмотров, чем обычные посты — делай их информативными.",
];

// ─── Метки инструментов ─────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  "post": "Пост",
  "carousel": "Карусель",
  "scenario": "Сценарий",
  "content-plan": "Контент-план",
  "profile": "Анализ профиля",
  "funnel": "Воронка",
  "presentation": "Презентация",
  "guide": "Гайд",
  "product-card": "Карточка товара",
  "reels": "Reels-анализ",
  "image-gen": "Изображение",
  "image-edit": "Редакт. фото",
  "roulette": "Рулетка",
  "hashtags": "Хэштеги",
  "bio": "Шапка профиля",
  "repurpose": "Переупаковка",
  "avatar": "ИИ-аватар",
  "stories": "Сторис",
  "brand-kit": "Бренд-кит",
  "sale-script": "Скрипт продаж",
  "email": "Email",
  "competitor": "Конкуренты",
  "case": "Кейс",
};

const TOOL_ICONS: Record<string, string> = {
  "post": "FileText",
  "carousel": "LayoutGrid",
  "scenario": "Film",
  "content-plan": "CalendarDays",
  "profile": "BarChart2",
  "funnel": "Filter",
  "presentation": "Presentation",
  "guide": "BookOpen",
  "product-card": "ShoppingBag",
  "reels": "Video",
  "image-gen": "ImagePlus",
  "image-edit": "Wand2",
  "roulette": "Dices",
  "hashtags": "Hash",
  "bio": "UserCircle",
  "repurpose": "RefreshCw",
  "avatar": "UserCircle2",
  "stories": "Smartphone",
  "brand-kit": "Shield",
  "sale-script": "MessageSquare",
  "email": "Mail",
  "competitor": "Search",
  "case": "Trophy",
};

const TOOL_COLORS: Record<string, string> = {
  "post":         "bg-blue-500/15 text-blue-300",
  "carousel":     "bg-purple-500/15 text-purple-300",
  "scenario":     "bg-red-500/15 text-red-300",
  "content-plan": "bg-green-500/15 text-green-300",
  "image-gen":    "bg-pink-500/15 text-pink-300",
  "image-edit":   "bg-orange-500/15 text-orange-300",
  "guide":        "bg-yellow-500/15 text-yellow-300",
  "funnel":       "bg-cyan-500/15 text-cyan-300",
  "hashtags":     "bg-sky-500/15 text-sky-300",
  "bio":          "bg-emerald-500/15 text-emerald-300",
  "sale-script":  "bg-orange-500/15 text-orange-300",
  "presentation": "bg-indigo-500/15 text-indigo-300",
};

// ─── Хелпер для форматирования даты ─────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} ч назад`;
  return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
}

// ─── Компонент ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [loadingGenerations, setLoadingGenerations] = useState(true);

  const tip = TIPS[new Date().getDay() * 3 % 10];

  const today = new Date().toLocaleDateString("ru", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });

  useEffect(() => {
    if (user) {
      toolsApi
        .myGenerations()
        .then((d) => setRecentGenerations(d.generations.slice(0, 5)))
        .catch(() => toast.error("Не удалось загрузить историю"))
        .finally(() => setLoadingGenerations(false));
    }
  }, [user]);

  if (!loading && !user) return <Navigate to="/" />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white/30 text-sm">
        Загрузка...
      </div>
    );
  }

  const sub = user!.subscription;

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />

      <div className="pt-24 pb-20 px-4 max-w-5xl mx-auto space-y-6">

        {/* ── 1. Приветствие ──────────────────────────────────────────────── */}
        <div className="glass border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">
              Привет, {user!.name}! 👋
            </h1>
            <p className="text-white/40 text-base">Чем займёмся сегодня?</p>
          </div>

          {/* Статус подписки */}
          <div className="flex-shrink-0">
            {sub ? (
              <div className="flex items-center gap-2.5 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Icon name="Crown" size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-white/40 leading-none mb-0.5">Тариф</p>
                  <p className="text-sm font-semibold text-primary leading-none">{sub.plan_name}</p>
                  {sub.expires_at && (
                    <p className="text-[11px] text-white/30 leading-none mt-0.5">
                      до {new Date(sub.expires_at).toLocaleDateString("ru")}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon name="User" size={16} className="text-white/40" />
                </div>
                <div>
                  <p className="text-xs text-white/30 leading-none mb-0.5">Тариф</p>
                  <p className="text-sm font-medium text-white/70 leading-none">Бесплатный</p>
                  <Link to="/pricing" className="text-[11px] text-primary hover:text-primary/80 leading-none mt-0.5 block transition-colors">
                    Улучшить →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 2. Совет дня ────────────────────────────────────────────────── */}
        <div className="glass border border-primary/15 rounded-2xl p-5 bg-primary/5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name="Lightbulb" size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">Совет дня</span>
              <span className="text-xs text-white/25">{today}</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{tip}</p>
          </div>
        </div>

        {/* ── 3. Быстрый старт ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold text-white">Быстрый старт</h2>
            <Link to="/tools" className="text-sm text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
              Все инструменты <Icon name="ArrowRight" size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_TOOLS.map((tool) => (
              <Link key={tool.href} to={tool.href}>
                <div
                  className={`glass bg-gradient-to-br ${tool.color} border rounded-xl p-4 flex flex-col items-center gap-2.5 text-center hover:border-primary/30 transition-colors group`}
                >
                  <div className="w-9 h-9 rounded-lg bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                    <Icon name={tool.icon} size={18} className="text-white/80" />
                  </div>
                  <span className="text-xs font-medium text-white/80 leading-tight">{tool.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── 4. Последние генерации ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold text-white">Недавнее</h2>
            <Link to="/profile" className="text-sm text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
              Вся история <Icon name="ArrowRight" size={14} />
            </Link>
          </div>

          <div className="glass border border-white/5 rounded-2xl overflow-hidden">
            {loadingGenerations ? (
              <div className="py-10 flex flex-col items-center gap-3 text-white/25">
                <Icon name="Loader2" size={22} className="animate-spin" />
                <span className="text-sm">Загружаем историю...</span>
              </div>
            ) : recentGenerations.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Icon name="HistoryX" size={22} className="text-white/20" />
                </div>
                <p className="text-white/30 text-sm">Генераций пока нет</p>
                <Link to="/tools">
                  <Button
                    size="sm"
                    className="mt-1 bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20"
                    variant="ghost"
                  >
                    Создать первый контент
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentGenerations.map((gen) => {
                  const toolColor = TOOL_COLORS[gen.tool_slug] ?? "bg-white/10 text-white/50";
                  const toolIcon  = TOOL_ICONS[gen.tool_slug]  ?? "Zap";
                  const toolLabel = TOOL_LABELS[gen.tool_slug] ?? gen.tool_slug;

                  return (
                    <div key={gen.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                      {/* Иконка инструмента */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${toolColor}`}>
                        <Icon name={toolIcon} size={15} />
                      </div>

                      {/* Тип + промт */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/50 mb-0.5">{toolLabel}</p>
                        <p className="text-sm text-white/80 truncate">{gen.prompt || "—"}</p>
                      </div>

                      {/* Дата */}
                      <span className="text-xs text-white/25 flex-shrink-0 ml-2">
                        {formatDate(gen.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── 5. Промо-баннеры ────────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-display font-bold text-white mb-4">Попробуй ещё</h2>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {PROMO_BANNERS.map((banner) => (
              <div
                key={banner.href}
                className={`flex-shrink-0 w-56 glass bg-gradient-to-br ${banner.color} border rounded-2xl p-5 flex flex-col gap-3`}
              >
                <div className={`w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center ${banner.iconColor}`}>
                  <Icon name={banner.icon} size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight mb-1">{banner.label}</p>
                  <p className="text-xs text-white/40 leading-snug">{banner.desc}</p>
                </div>
                <Link to={banner.href} className="mt-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full h-8 text-xs bg-black/20 text-white/70 hover:text-white hover:bg-black/30 border border-white/10"
                  >
                    Попробовать
                    <Icon name="ArrowRight" size={12} className="ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
