import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import AuthModal from "@/components/AuthModal";
import { toolsApi, Plan } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const PLAN_HIGHLIGHTS: Record<string, { color: string; badge?: string; features: string[] }> = {
  start_3: {
    color: "border-white/10",
    features: ["3 генерации на каждый инструмент", "Все 12 инструментов", "Генерация текстов и изображений", "Экспорт результатов"],
  },
  basic_5: {
    color: "border-blue-500/30",
    badge: "ПОПУЛЯРНЫЙ",
    features: ["5 генераций на каждый инструмент", "Все 12 инструментов", "Приоритетная обработка", "Экспорт результатов"],
  },
  advanced_10: {
    color: "border-violet-500/30",
    features: ["10 генераций на каждый инструмент", "Все 12 инструментов", "Приоритетная обработка", "Экспорт результатов"],
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
  const { user } = useAuth();

  useEffect(() => {
    toolsApi.getPlans().then((d) => setPlans(d.plans)).finally(() => setLoading(false));
  }, []);

  const getPlan = (slug: string) => plans.find((p) => p.slug === slug);

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="tag-pill text-primary/60 mb-3">ТАРИФЫ</p>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Выбери свой план
          </h1>
          <p className="text-white/40 max-w-xl mx-auto">
            От пробного до безлимитного. Первые генерации бесплатно — без карты.
          </p>
        </div>

        <div className="glass rounded-xl p-6 mb-12 border border-primary/10 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Icon name="Gift" size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-white font-medium">Начни бесплатно</p>
              <p className="text-sm text-white/40">1 бесплатная генерация изображений + 1 карусель без регистрации карты</p>
            </div>
          </div>
          {!user && (
            <Button onClick={() => setAuthOpen(true)} className="bg-primary text-black font-semibold hover:bg-primary/90 flex-shrink-0">
              Зарегистрироваться
            </Button>
          )}
        </div>

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
                    const isBest = slug === "unlimited_month" || slug === "unlimited_year";
                    return (
                      <div
                        key={slug}
                        className={`glass rounded-xl border ${meta.color} p-5 relative flex flex-col ${isBest ? "bg-primary/5" : ""}`}
                      >
                        {meta.badge && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 tag-pill bg-primary text-black px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap">
                            {meta.badge}
                          </span>
                        )}
                        <div className="mb-4">
                          <h3 className="font-display font-bold text-white text-lg">{plan.name}</h3>
                          <p className="text-xs text-white/40 mt-1">{plan.description}</p>
                        </div>
                        <div className="mb-5">
                          <span className="text-3xl font-display font-bold text-white">{plan.price.toLocaleString("ru")}₽</span>
                          <span className="text-white/30 text-sm">
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
                          onClick={() => !user && setAuthOpen(true)}
                          className={`w-full ${isBest ? "bg-primary text-black hover:bg-primary/90" : "bg-white/5 text-white hover:bg-white/10 border border-white/10"}`}
                        >
                          {user ? "Подключить" : "Начать"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 glass rounded-xl p-8 border border-white/5">
          <h2 className="text-xl font-display font-bold text-white mb-6 text-center">Часто задаваемые вопросы</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { q: "Можно ли пользоваться бесплатно?", a: "Да! После регистрации вы получаете 1 бесплатную генерацию изображений и 1 пост-карусель без оплаты." },
              { q: "Как работает реферальная программа?", a: "За каждого приглашённого по вашей ссылке друга вы получаете +1 бесплатную генерацию изображения." },
              { q: "Что значит 'один инструмент'?", a: "Тариф действует только для одного выбранного вами инструмента. Например, только для генерации изображений или только для контент-плана." },
              { q: "Можно ли сменить тариф?", a: "Да, вы можете в любой момент перейти на более высокий тариф. Оставшиеся дни автоматически учтутся." },
            ].map((item) => (
              <div key={item.q} className="space-y-1">
                <p className="text-white font-medium text-sm">{item.q}</p>
                <p className="text-sm text-white/40">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
