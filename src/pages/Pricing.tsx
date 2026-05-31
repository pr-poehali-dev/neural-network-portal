import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";
import AuthModal from "@/components/AuthModal";
import { toolsApi, paymentsApi, Plan } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PricingImagePacks from "@/components/pricing/PricingImagePacks";
import PricingPlanCard from "@/components/pricing/PricingPlanCard";
import PricingToolSelectModal from "@/components/pricing/PricingToolSelectModal";
import PricingFooter from "@/components/pricing/PricingFooter";

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
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user, refreshUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    toolsApi.getPlans().then((d) => setPlans(d.plans)).finally(() => setLoading(false));
  }, []);

  // Polling после редиректа от ЮКассы
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("payment") !== "success") return;

    const paymentId = localStorage.getItem("pending_payment_id");
    if (!paymentId) {
      toast.success("Оплата прошла! Обновляем данные...", { duration: 5000 });
      refreshUser();
      return;
    }

    localStorage.removeItem("pending_payment_id");
    setPolling(true);
    toast.info("Проверяем статус оплаты...", { id: "payment-poll", duration: 60000 });

    let attempts = 0;
    const maxAttempts = 20;

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await paymentsApi.status(paymentId);
        if (res.status === "paid") {
          clearInterval(pollRef.current!);
          setPolling(false);
          await refreshUser();
          toast.dismiss("payment-poll");
          toast.success("Оплата подтверждена! Баланс пополнен.", { duration: 6000 });
        } else if (attempts >= maxAttempts) {
          clearInterval(pollRef.current!);
          setPolling(false);
          toast.dismiss("payment-poll");
          toast.warning("Платёж обрабатывается. Обнови страницу через минуту.", { duration: 8000 });
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(pollRef.current!);
          setPolling(false);
          toast.dismiss("payment-poll");
        }
      }
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
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
        if (result.payment_id) {
          localStorage.setItem("pending_payment_id", result.payment_id);
        }
        window.location.href = result.confirmation_url;
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка создания платежа");
    } finally {
      setPaying(null);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">

        {polling && (
          <div className="glass rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6 flex items-center gap-3">
            <Icon name="Loader2" size={18} className="text-primary animate-spin flex-shrink-0" />
            <div>
              <p className="text-white font-medium text-sm">Ожидаем подтверждение от банка...</p>
              <p className="text-white/40 text-xs mt-0.5">Обычно занимает 5–30 секунд. Не закрывай страницу.</p>
            </div>
          </div>
        )}

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

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <Icon name="Loader2" size={24} className="animate-spin mr-2" /> Загрузка тарифов...
          </div>
        ) : (
          <div className="space-y-12">

            <PricingImagePacks paying={paying} user={user} onPay={handlePay} />

            {PLAN_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="tag-pill text-white/30 mb-5">{group.title.toUpperCase()}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {group.slugs.map((slug) => {
                    const plan = getPlan(slug);
                    if (!plan) return null;
                    return (
                      <PricingPlanCard
                        key={slug}
                        plan={plan}
                        paying={paying}
                        activeSlug={user?.subscription?.plan_slug}
                        user={user}
                        onPay={handlePay}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Выбор инструмента для single_tool тарифов */}
        {toolSelectFor && (
          <PricingToolSelectModal
            toolSelectFor={toolSelectFor}
            selectedTool={selectedTool}
            paying={paying}
            onSelectTool={setSelectedTool}
            onCancel={() => { setToolSelectFor(null); setSelectedTool(""); }}
            onConfirm={() => {
              const slug = toolSelectFor;
              setToolSelectFor(null);
              handlePay(slug, selectedTool);
              setSelectedTool("");
            }}
          />
        )}

        <PricingFooter />
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
