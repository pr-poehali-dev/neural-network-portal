import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Plan } from "@/lib/api";

const PLAN_HIGHLIGHTS: Record<string, { color: string; badge?: string; features: string[] }> = {
  start_3: {
    color: "border-white/10",
    features: [
      "3 генерации на каждый инструмент",
      "Все 25 ИИ-инструментов",
      "Посты, карусели, сценарии, хэштеги",
      "Скрипты продаж, кейсы, email",
      "История генераций",
    ],
  },
  basic_5: {
    color: "border-blue-500/30",
    badge: "ПОПУЛЯРНЫЙ",
    features: [
      "5 генераций на каждый инструмент",
      "Все 25 ИИ-инструментов",
      "Генерация изображений и аватаров",
      "Контент-план + Excel экспорт",
      "Презентации PPTX с картинками",
      "История генераций",
    ],
  },
  advanced_10: {
    color: "border-violet-500/30",
    features: [
      "10 генераций на каждый инструмент",
      "Все 25 ИИ-инструментов",
      "Бренд-кит и анализ конкурентов",
      "Рекламные объявления для Директа/VK",
      "Переупаковщик контента",
      "История генераций",
    ],
  },
  unlimited_month: {
    color: "border-primary/40",
    badge: "ЛУЧШИЙ ВЫБОР",
    features: [
      "Безлимитные генерации",
      "Все 25 ИИ-инструментов",
      "ИИ-ассистент без ограничений",
      "Stories, аватары, презентации",
      "Контент-план с аналитикой",
      "Приоритетная обработка",
    ],
  },
  single_tool: {
    color: "border-orange-500/20",
    features: [
      "15 генераций",
      "1 инструмент на выбор из 25",
      "Подходит для тестирования",
      "Полный функционал инструмента",
    ],
  },
  single_tool_unlimited: {
    color: "border-orange-500/30",
    features: [
      "Безлимитные генерации",
      "1 инструмент на выбор из 25",
      "Идеально для специалиста",
      "Полный функционал инструмента",
    ],
  },
  unlimited_3m: {
    color: "border-primary/30",
    badge: "ЭКОНОМИЯ 22%",
    features: [
      "Безлимит на 3 месяца",
      "Все 25 ИИ-инструментов",
      "Новые инструменты автоматически",
      "Приоритетная обработка",
      "История генераций",
    ],
  },
  unlimited_6m: {
    color: "border-primary/40",
    badge: "ЭКОНОМИЯ 33%",
    features: [
      "Безлимит на 6 месяцев",
      "Все 25 ИИ-инструментов",
      "Новые инструменты автоматически",
      "Максимальный приоритет",
      "Полная история генераций",
    ],
  },
  unlimited_year: {
    color: "border-primary/50",
    badge: "МАКСИМУМ ЭКОНОМИИ",
    features: [
      "Безлимит на 12 месяцев",
      "Все 25 ИИ-инструментов",
      "Новые инструменты автоматически",
      "Максимальный приоритет",
      "VIP поддержка",
    ],
  },
};

const isBest = (slug: string) => slug === "unlimited_month" || slug === "unlimited_year";

interface Props {
  plan: Plan;
  paying: string | null;
  activeSlug: string | undefined;
  user: unknown;
  onPay: (slug: string) => void;
}

export default function PricingPlanCard({ plan, paying, activeSlug, user, onPay }: Props) {
  const slug = plan.slug;
  const meta = PLAN_HIGHLIGHTS[slug] || { color: "border-white/10", features: [] };
  const isActive = activeSlug === slug;
  const isPaying = paying === slug;

  return (
    <div
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
        onClick={() => onPay(slug)}
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

      {!isActive && user && (
        <p className="text-[10px] text-white/20 text-center mt-2">
          Оплата через ЮКассу · Карты, СБП, ЮMoney
        </p>
      )}
    </div>
  );
}
