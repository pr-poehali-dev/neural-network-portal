import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import AuthModal from "@/components/AuthModal";
import { toolsApi, paymentsApi, Plan } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const TOOL_NAMES: Record<string, string> = {
  "post": "Генерация постов",
  "carousel": "Пост-карусель",
  "scenario": "Сценарии",
  "content-plan": "Контент-план",
  "profile": "Анализ профиля",
  "funnel": "Воронки продаж",
  "presentation": "Презентации",
  "guide": "Гайды и чеклисты",
  "product-card": "Карточки товаров",
  "reels": "Аналитика Reels",
  "image-gen": "Генерация изображений",
  "roulette": "Фото-рулетка",
};

const PLAN_HIGHLIGHTS: Record<string, { color: string; badge?: string; features: string[] }> = {
  start_3: {
    color: "border-white/10",
    features: ["3 генерации на каждый инструмент", "Все 12 инструментов", "Генерация текстов и изображений", "История генераций"],
  },
  basic_5: {
    color: "border-blue-500/30",
    badge: "ПОПУЛЯРНЫЙ",
    features: ["5 генераций на каждый инструмент", "Все 12 инструментов", "Приоритетная обработка", "История генераций"],
  },
  advanced_10: {
    color: "border-violet-500/30",
    features: ["10 генераций на каждый инструмент", "Все 12 инструментов", "Приоритетная обработка", "История генераций"],
  },
  unlimited_month: {
    color: "border-primary/40",
    badge: "ЛУЧШИЙ ВЫБОР",
    features: ["Безлимитные генерации", "Все 12 инструментов", "Максимальный приоритет", "История генераций"],
  },
  single_tool: {
    color: "border-orange-500/20",
    features: ["15 генераций", "1 выбранный инструмент", "Подходит для тестирования", "Всегда доступен"],
  },
  single_tool_unlimited: {
    color: "border-orange-500/30",
    features: ["Безлимитные генерации", "1 выбранный инструмент", "Лучшее решение для специалиста"],
  },
  unlimited_3m: {
    color: "border-primary/30",
    badge: "ЭКОНОМИЯ 22%",
    features: ["Безлимит на 3 месяца", "Все 12 инструментов", "Максимальный приоритет", "История генераций"],
  },
  unlimited_6m: {
    color: "border-primary/40",
    badge: "ЭКОНОМИЯ 33%",
    features: ["Безлимит на 6 месяцев", "Все 12 инструментов", "Максимальный приоритет", "Полная история"],
  },
  unlimited_year: {
    color: "border-primary/50",
    badge: "МАКСИМУМ ЭКОНОМИИ",
    features: ["Безлимит на 12 месяцев", "Все 12 инструментов", "Максимальный приоритет", "VIP поддержка"],
  },
};

const PLAN_GROUPS = [
  { title: "Месячные тарифы", slugs: ["start_3", "basic_5", "advanced_10", "unlimited_month"] },
  { title: "Один инструмент", slugs: ["single_tool", "single_tool_unlimited"] },
  { title: "Долгосрочные тарифы", slugs: ["unlimited_3m", "unlimited_6m", "unlimited_year"] },
];

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [toolSelectFor, setToolSelectFor] = useState<string | null>(null);
  const { user, refreshUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    toolsApi.getPlans().then((d) => setPlans(d.plans)).finally(() => setLoading(false));
  }, []);

  // Показываем успех после редиректа от ЮКассы
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("payment") === "success") {
      toast.success("Оплата прошла! Подписка активирована.", { duration: 6000 });
      if (user) refreshUser();
    }
  }, [location.search]);

  const getPlan = (slug: string) => plans.find((p) => p.slug === slug);

  const handlePay = async (plan_slug: string, single_tool_slug?: string) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    // Если тариф на один инструмент и инструмент не выбран — показать выбор
    const plan = getPlan(plan_slug);
    if (plan?.is_single_tool && !single_tool_slug) {
      setToolSelectFor(plan_slug);
      return;
    }

    setPaying(plan_slug);
    try {
      const result = await paymentsApi.create(plan_slug, single_tool_slug);

      if (result.demo) {
        toast.info(
          <div>
            <p className="font-medium">Демо-режим оплаты</p>
            <p className="text-sm opacity-70 mt-1">ЮКасса не настроена. Добавь ключи в настройках.</p>
          </div>,
          { duration: 8000 }
        );
        return;
      }

      if (result.confirmation_url) {
        window.location.href = result.confirmation_url;
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка создания платежа");
    } finally {
      setPaying(null);
    }
  };

  const isBest = (slug: string) => slug === "unlimited_month" || slug === "unlimited_year";

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="tag-pill text-primary/60 mb-3">ТАРИФЫ</p>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Выбери свой план
          </h1>
          <p className="text-white/40 max-w-xl mx-auto">
            От пробного до безлимитного. Оплата через ЮКассу — безопасно и быстро.
          </p>
        </div>

        {/* Current subscription banner */}
        {user?.subscription && (
          <div className="glass rounded-xl p-5 mb-8 border border-primary/20 bg-primary/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Icon name="Crown" size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Текущий тариф: {user.subscription.plan_name}</p>
              <p className="text-sm text-white/40">
                {user.subscription.is_unlimited ? "Безлимитный доступ" : `${user.subscription.generations_per_tool} генераций на инструмент`}
                {user.subscription.expires_at && ` · действует до ${new Date(user.subscription.expires_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`}
              </p>
            </div>
            <Icon name="CheckCircle" size={20} className="text-primary flex-shrink-0" />
          </div>
        )}

        {/* Free trial banner */}
        {!user?.subscription && (
          <div className="glass rounded-xl p-6 mb-12 border border-primary/10 flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Icon name="Gift" size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-white font-medium">Начни бесплатно — без карты</p>
                <p className="text-sm text-white/40">1 генерация изображений + 1 пост-карусель бесплатно после регистрации</p>
              </div>
            </div>
            {!user && (
              <Button onClick={() => setAuthOpen(true)} className="bg-primary text-black font-semibold hover:bg-primary/90 flex-shrink-0">
                Зарегистрироваться
              </Button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <Icon name="Loader2" size={24} className="animate-spin mr-2" /> Загрузка тарифов...
          </div>
        ) : (
          <div className="space-y-12">
            {PLAN_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="tag-pill text-white/30 mb-5">{group.title.toUpperCase()}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {group.slugs.map((slug) => {
                    const plan = getPlan(slug);
                    if (!plan) return null;
                    const meta = PLAN_HIGHLIGHTS[slug] || { color: "border-white/10", features: [] };
                    const isActive = user?.subscription?.plan_slug === slug;
                    const isPaying = paying === slug;

                    return (
                      <div
                        key={slug}
                        className={`glass rounded-xl border ${meta.color} p-5 relative flex flex-col ${isBest(slug) ? "bg-primary/5" : ""} ${isActive ? "ring-1 ring-primary" : ""}`}
                      >
                        {meta.badge && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 tag-pill bg-primary text-black px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap z-10">
                            {meta.badge}
                          </span>
                        )}
                        {isActive && (
                          <span className="absolute -top-3 right-4 tag-pill bg-green-500 text-black px-2 py-0.5 rounded-full text-[10px] font-bold">
                            АКТИВЕН
                          </span>
                        )}

                        <div className="mb-4">
                          <h3 className="font-display font-bold text-white text-lg">{plan.name}</h3>
                          <p className="text-xs text-white/40 mt-1">{plan.description}</p>
                        </div>

                        <div className="mb-5">
                          <span className="text-3xl font-display font-bold text-white">
                            {plan.price.toLocaleString("ru-RU")}₽
                          </span>
                          <span className="text-white/30 text-sm ml-1">
                            {plan.duration_months === 1 ? "/мес" : `/${plan.duration_months} мес`}
                          </span>
                        </div>

                        <ul className="space-y-2 mb-6 flex-1">
                          {meta.features.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                              <Icon name="Check" size={13} className="text-primary flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>

                        <Button
                          onClick={() => handlePay(slug)}
                          disabled={isPaying || isActive}
                          className={`w-full ${
                            isActive
                              ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                              : isBest(slug)
                              ? "bg-primary text-black hover:bg-primary/90 font-semibold"
                              : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                          }`}
                        >
                          {isPaying ? (
                            <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Переходим к оплате...</>
                          ) : isActive ? (
                            <><Icon name="CheckCircle" size={14} className="mr-2" />Активен</>
                          ) : user ? (
                            <><Icon name="CreditCard" size={14} className="mr-2" />Оплатить {plan.price.toLocaleString("ru-RU")}₽</>
                          ) : (
                            "Начать"
                          )}
                        </Button>

                        {/* Подсказка при наведении */}
                        {!isActive && user && (
                          <p className="text-[10px] text-white/20 text-center mt-2">
                            Оплата через ЮКассу · Карты, СБП, ЮMoney
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Выбор инструмента для single_tool тарифов */}
        {toolSelectFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="glass rounded-2xl border border-white/10 p-6 max-w-sm w-full">
              <h3 className="font-display font-bold text-white text-xl mb-2">Выбери инструмент</h3>
              <p className="text-sm text-white/40 mb-5">Тариф будет действовать только для этого инструмента</p>
              <div className="grid grid-cols-2 gap-2 mb-5 max-h-64 overflow-y-auto">
                {Object.entries(TOOL_NAMES).map(([slug, name]) => (
                  <button
                    key={slug}
                    onClick={() => setSelectedTool(slug)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedTool === slug
                        ? "bg-primary text-black font-medium"
                        : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setToolSelectFor(null); setSelectedTool(""); }}
                  className="flex-1 border-white/10 text-white/60 hover:text-white"
                >
                  Отмена
                </Button>
                <Button
                  disabled={!selectedTool || paying === toolSelectFor}
                  onClick={() => {
                    const slug = toolSelectFor;
                    setToolSelectFor(null);
                    handlePay(slug, selectedTool);
                    setSelectedTool("");
                  }}
                  className="flex-1 bg-primary text-black font-semibold hover:bg-primary/90"
                >
                  {paying === toolSelectFor ? (
                    <Icon name="Loader2" size={14} className="animate-spin" />
                  ) : (
                    "Оплатить"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-16 glass rounded-xl p-8 border border-white/5">
          <h2 className="text-xl font-display font-bold text-white mb-6 text-center">Часто задаваемые вопросы</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { q: "Как происходит оплата?", a: "Оплата через ЮКассу — безопасный российский сервис. Принимаем карты (Visa, Мир), СБП, ЮMoney и другие способы." },
              { q: "Когда активируется подписка?", a: "Сразу после подтверждения оплаты — автоматически. Обычно это занимает несколько секунд." },
              { q: "Можно ли получить возврат?", a: "Да, в течение 14 дней после оплаты если вы не использовали генерации. Напишите в поддержку." },
              { q: "Что если я уже плачу?", a: "При покупке нового тарифа он начнёт действовать с момента истечения текущего, или можно перейти сразу — напишите нам." },
            ].map((item) => (
              <div key={item.q} className="space-y-1">
                <p className="text-white font-medium text-sm flex items-start gap-2">
                  <Icon name="HelpCircle" size={14} className="text-primary mt-0.5 flex-shrink-0" />
                  {item.q}
                </p>
                <p className="text-sm text-white/40 pl-5">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Способы оплаты */}
        <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
          <span className="text-xs text-white/20">Принимаем:</span>
          {["Карты Мир", "Visa / MC", "СБП", "ЮMoney", "QIWI"].map((m) => (
            <span key={m} className="tag-pill bg-white/5 text-white/30 px-3 py-1.5 rounded-lg text-xs border border-white/5">
              {m}
            </span>
          ))}
          <div className="flex items-center gap-1 text-xs text-white/20">
            <Icon name="Lock" size={11} />
            Защищено ЮКассой
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
