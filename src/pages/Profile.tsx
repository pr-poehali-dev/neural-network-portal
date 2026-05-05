import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";
import { toolsApi, Generation } from "@/lib/api";
import { toast } from "sonner";

const TOOL_LABELS: Record<string, string> = {
  "post": "Пост", "carousel": "Карусель", "scenario": "Сценарий",
  "content-plan": "Контент-план", "profile": "Анализ профиля",
  "funnel": "Воронка", "presentation": "Презентация", "guide": "Гайд",
  "product-card": "Карточка товара", "reels": "Reels-анализ",
  "image-gen": "Изображение", "roulette": "Рулетка",
};

export default function Profile() {
  const { user, loading } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [genLoading, setGenLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      toolsApi.myGenerations()
        .then((d) => setGenerations(d.generations))
        .finally(() => setGenLoading(false));
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

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto space-y-6">
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

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="glass rounded-xl border border-white/5 p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{user!.free_image_generations}</p>
            <p className="text-xs text-white/40 mt-1">Бесплатных генерации изображений</p>
          </div>
          <div className="glass rounded-xl border border-white/5 p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{user!.free_carousel_generations}</p>
            <p className="text-xs text-white/40 mt-1">Бесплатных карусели</p>
          </div>
          <div className="glass rounded-xl border border-white/5 p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{user!.bonus_generations}</p>
            <p className="text-xs text-white/40 mt-1">Бонусных генераций за рефералов</p>
          </div>
        </div>

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

        <div className="glass rounded-xl border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Users" size={16} className="text-primary" />
            <h2 className="text-white font-medium">Реферальная программа</h2>
          </div>
          <p className="text-sm text-white/40 mb-4">За каждого приглашённого друга вы получаете +1 бесплатную генерацию изображения</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={refLink}
              className="flex-1 bg-white/5 border border-white/10 text-white/60 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={copyRef}
              className="px-4 py-2 bg-primary text-black text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              <Icon name={copied ? "Check" : "Copy"} size={14} />
            </button>
          </div>
          <p className="text-xs text-white/25 mt-2">Бонусных генераций получено: {user!.bonus_generations}</p>
        </div>

        <div className="glass rounded-xl border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-white font-medium">История генераций</h2>
          </div>
          {genLoading ? (
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
            <div className="divide-y divide-white/5">
              {generations.slice(0, 20).map((g) => (
                <div key={g.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="tag-pill bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] flex-shrink-0">
                      {TOOL_LABELS[g.tool_slug] || g.tool_slug}
                    </span>
                    <p className="text-sm text-white/50 truncate">{g.prompt}</p>
                  </div>
                  <span className="text-xs text-white/25 flex-shrink-0 ml-3">
                    {new Date(g.created_at).toLocaleDateString("ru")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
