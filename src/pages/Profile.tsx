import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";
import { toolsApi, paymentsApi } from "@/lib/api";
import type { Generation, PaymentRecord } from "@/lib/api";
import { toast } from "sonner";

const TOOL_LABELS: Record<string, string> = {
  "post": "Пост", "carousel": "Карусель", "scenario": "Сценарий",
  "content-plan": "Контент-план", "profile": "Анализ профиля",
  "funnel": "Воронка", "presentation": "Презентация", "guide": "Гайд",
  "product-card": "Карточка товара", "reels": "Reels-анализ",
  "image-gen": "Изображение", "image-edit": "Редакт. фото", "roulette": "Рулетка",
};

const TOOL_ICONS: Record<string, string> = {
  "post": "FileText", "carousel": "LayoutGrid", "scenario": "Film",
  "content-plan": "CalendarDays", "profile": "BarChart2", "funnel": "Filter",
  "presentation": "Presentation", "guide": "BookOpen", "product-card": "ShoppingBag",
  "reels": "Video", "image-gen": "ImagePlus", "image-edit": "Wand2", "roulette": "Dices",
};

const TOOL_COLORS: Record<string, string> = {
  "post":         "bg-blue-500/20 text-blue-300",
  "carousel":     "bg-purple-500/20 text-purple-300",
  "scenario":     "bg-red-500/20 text-red-300",
  "content-plan": "bg-green-500/20 text-green-300",
  "image-gen":    "bg-pink-500/20 text-pink-300",
  "image-edit":   "bg-orange-500/20 text-orange-300",
  "guide":        "bg-yellow-500/20 text-yellow-300",
  "funnel":       "bg-cyan-500/20 text-cyan-300",
};

type ActiveTab = "generations" | "payments";

export default function Profile() {
  const { user, loading } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [genLoading, setGenLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("generations");
  const [filterSlug, setFilterSlug] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      toolsApi.myGenerations()
        .then((d) => setGenerations(d.generations))
        .finally(() => setGenLoading(false));
      paymentsApi.history()
        .then((d) => setPayments(d.payments))
        .catch(() => {});
    }
  }, [user]);

  if (!loading && !user) return <Navigate to="/" />;
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white/30">Загрузка...</div>;

  const refLink = `${window.location.origin}?ref=${user!.referral_code}`;

  const copyRef = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    toast.success("Ссылка скопирована!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Уникальные типы для фильтра
  const usedSlugs = Array.from(new Set(generations.map(g => g.tool_slug)));

  const filtered = filterSlug === "all"
    ? generations
    : generations.filter(g => g.tool_slug === filterSlug);

  const isImage = (g: Generation) =>
    (g.tool_slug === "image-gen" || g.tool_slug === "image-edit") && g.result_url;

  const getResultText = (g: Generation): string | null => {
    if (!g.result_data) return null;
    const d = g.result_data as Record<string, unknown>;
    if (typeof d.result === "string") return d.result;
    return null;
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto space-y-6">

        {/* Шапка профиля */}
        <div className="glass rounded-xl border border-white/5 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-display font-bold text-2xl">
              {user!.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white">{user!.name}</h1>
              <p className="text-sm text-white/40">{user!.email}</p>
              {user!.is_admin && (
                <span className="tag-pill bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] mt-1 inline-block">АДМИНИСТРАТОР</span>
              )}
            </div>
          </div>
        </div>

        {/* Счётчики */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="glass rounded-xl border border-white/5 p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{user!.image_credits ?? 0}</p>
            <p className="text-xs text-white/40 mt-1">Изображений на балансе</p>
          </div>
          <div className="glass rounded-xl border border-white/5 p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{user!.bonus_generations}</p>
            <p className="text-xs text-white/40 mt-1">Бонусных генераций за рефералов</p>
          </div>
        </div>

        {/* Подписка */}
        {user!.subscription ? (
          <div className="glass rounded-xl border border-primary/20 p-5 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <Icon name="Crown" size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-white font-medium">Тариф: {user!.subscription.plan_name}</p>
                <p className="text-sm text-white/40">
                  {user!.subscription.is_unlimited ? "Безлимитные генерации" : `${user!.subscription.generations_per_tool} генераций на инструмент`}
                  {user!.subscription.expires_at && ` · до ${new Date(user!.subscription.expires_at).toLocaleDateString("ru")}`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-xl border border-white/10 p-5 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Нет активного тарифа</p>
              <p className="text-sm text-white/40">Выбери план для доступа ко всем функциям</p>
            </div>
            <Link to="/pricing">
              <button className="px-4 py-2 bg-primary text-black text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                Выбрать тариф
              </button>
            </Link>
          </div>
        )}

        {/* Реферальная программа */}
        <div className="glass rounded-xl border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Users" size={16} className="text-primary" />
            <h2 className="text-white font-medium">Реферальная программа</h2>
          </div>
          <p className="text-sm text-white/40 mb-4">За каждого приглашённого друга вы получаете +1 бесплатную генерацию изображения</p>
          <div className="flex gap-2">
            <input readOnly value={refLink}
              className="flex-1 bg-white/5 border border-white/10 text-white/60 rounded-lg px-3 py-2 text-sm" />
            <button onClick={copyRef}
              className="px-4 py-2 bg-primary text-black text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0">
              <Icon name={copied ? "Check" : "Copy"} size={14} />
            </button>
          </div>
          <p className="text-xs text-white/25 mt-2">Бонусных генераций получено: {user!.bonus_generations}</p>
        </div>

        {/* Вкладки */}
        <div className="glass rounded-xl border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex gap-4">
            <button onClick={() => setActiveTab("generations")}
              className={`text-sm font-medium transition-colors ${activeTab === "generations" ? "text-primary" : "text-white/40 hover:text-white"}`}>
              История генераций
              {generations.length > 0 && <span className="ml-1.5 text-xs bg-white/10 px-1.5 py-0.5 rounded">{generations.length}</span>}
            </button>
            <button onClick={() => setActiveTab("payments")}
              className={`text-sm font-medium transition-colors ${activeTab === "payments" ? "text-primary" : "text-white/40 hover:text-white"}`}>
              Платежи
              {payments.length > 0 && <span className="ml-1 text-xs bg-white/10 px-1.5 py-0.5 rounded">{payments.length}</span>}
            </button>
          </div>

          {/* ── ИСТОРИЯ ── */}
          {activeTab === "generations" && (
            genLoading ? (
              <div className="p-8 text-center text-white/30">
                <Icon name="Loader2" size={20} className="animate-spin mx-auto mb-2" />
                <p className="text-sm">Загрузка...</p>
              </div>
            ) : generations.length === 0 ? (
              <div className="p-8 text-center text-white/25">
                <Icon name="History" size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Пока нет генераций. Попробуй один из инструментов!</p>
                <Link to="/tools" className="text-primary text-sm hover:text-primary/80 mt-2 inline-block">Перейти к инструментам →</Link>
              </div>
            ) : (
              <>
                {/* Фильтр по типу */}
                <div className="px-5 py-3 border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-hide">
                  <button onClick={() => setFilterSlug("all")}
                    className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition-all ${filterSlug === "all" ? "bg-primary text-black font-medium" : "bg-white/5 text-white/40 hover:text-white"}`}>
                    Все ({generations.length})
                  </button>
                  {usedSlugs.map(slug => (
                    <button key={slug} onClick={() => setFilterSlug(slug)}
                      className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition-all ${filterSlug === slug ? "bg-primary text-black font-medium" : "bg-white/5 text-white/40 hover:text-white"}`}>
                      {TOOL_LABELS[slug] || slug} ({generations.filter(g => g.tool_slug === slug).length})
                    </button>
                  ))}
                </div>

                {/* Сетка карточек */}
                <div className="p-4 grid gap-3 sm:grid-cols-2">
                  {filtered.map((g) => {
                    const isImg = isImage(g);
                    const resultText = getResultText(g);
                    const isExpanded = expandedId === g.id;
                    const colorClass = TOOL_COLORS[g.tool_slug] ?? "bg-white/10 text-white/60";
                    const iconName = TOOL_ICONS[g.tool_slug] ?? "Sparkles";

                    return (
                      <div key={g.id} className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all">
                        {/* Превью изображения */}
                        {isImg && (
                          <div className="relative group">
                            <img
                              src={g.result_url!}
                              alt={g.prompt}
                              className="w-full h-48 object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                            <a
                              href={g.result_url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                <Icon name="ExternalLink" size={12} />
                                Открыть
                              </span>
                            </a>
                          </div>
                        )}

                        <div className="p-4 space-y-2">
                          {/* Шапка */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${colorClass}`}>
                              <Icon name={iconName} size={11} />
                              {TOOL_LABELS[g.tool_slug] || g.tool_slug}
                            </span>
                            <span className="text-[11px] text-white/25">
                              {new Date(g.created_at).toLocaleDateString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          {/* Промт */}
                          <p className="text-sm text-white/70 leading-snug line-clamp-2">{g.prompt}</p>

                          {/* Текстовый результат */}
                          {resultText && (
                            <div>
                              <div className={`text-xs text-white/40 leading-relaxed whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-3"}`}>
                                {resultText}
                              </div>
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : g.id)}
                                className="text-xs text-primary/70 hover:text-primary mt-1 transition-colors"
                              >
                                {isExpanded ? "Свернуть ↑" : "Читать полностью ↓"}
                              </button>
                            </div>
                          )}

                          {/* Кнопки */}
                          <div className="flex gap-2 pt-1">
                            {g.result_url && !isImg && (
                              <a href={g.result_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors">
                                <Icon name="ExternalLink" size={11} />
                                Открыть файл
                              </a>
                            )}
                            {resultText && (
                              <button
                                onClick={() => { navigator.clipboard.writeText(resultText); toast.success("Скопировано!"); }}
                                className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors ml-auto"
                              >
                                <Icon name="Copy" size={11} />
                                Копировать
                              </button>
                            )}
                            {isImg && (
                              <a href={g.result_url!} download
                                className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors ml-auto">
                                <Icon name="Download" size={11} />
                                Скачать
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          )}

          {/* ── ПЛАТЕЖИ ── */}
          {activeTab === "payments" && (
            payments.length === 0 ? (
              <div className="p-8 text-center text-white/25">
                <Icon name="CreditCard" size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Платежей пока нет</p>
                <Link to="/pricing" className="text-primary text-sm hover:text-primary/80 mt-2 inline-block">Выбрать тариф →</Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {payments.map((p) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === "paid" ? "bg-green-400" : "bg-yellow-400"}`} />
                      <div className="min-w-0">
                        <p className="text-sm text-white/70">{p.plan_name}</p>
                        <p className="text-xs text-white/30">
                          {p.status === "paid" ? "Оплачен" : "Ожидает оплаты"} · {new Date(p.created_at).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-white/60 flex-shrink-0 ml-3">
                      {p.amount.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}