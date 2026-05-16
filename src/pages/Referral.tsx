import { useState } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Referral() {
  const { user, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!loading && !user) return <Navigate to="/" />;
  if (loading) return null;

  const refLink = `${window.location.origin}?ref=${user!.referral_code}`;

  const copy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    toast.success("Ссылка скопирована!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Icon name="Users" size={28} className="text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Реферальная программа</h1>
          <p className="text-white/40">Приглашай друзей и получай бонусные генерации</p>
        </div>

        <div className="glass rounded-xl border border-primary/20 p-6 mb-6 bg-primary/5">
          <div className="text-center mb-6">
            <p className="text-5xl font-display font-bold neon-text mb-2">+1</p>
            <p className="text-white/60">бонусная генерация изображения</p>
            <p className="text-sm text-white/30 mt-1">за каждого приглашённого друга</p>
          </div>

          <div className="space-y-3">
            {[
              { step: "1", text: "Поделись своей ссылкой с друзьями" },
              { step: "2", text: "Друг регистрируется по твоей ссылке" },
              { step: "3", text: "Ты получаешь +1 бонусную генерацию фото" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-xs font-bold">{item.step}</span>
                </div>
                <p className="text-sm text-white/60">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl border border-white/5 p-6 space-y-4">
          <h2 className="text-white font-medium">Твоя реферальная ссылка</h2>
          <div className="flex gap-2">
            <input
              readOnly
              value={refLink}
              className="flex-1 bg-white/5 border border-white/10 text-white/70 rounded-lg px-3 py-2.5 text-sm"
            />
            <button
              onClick={copy}
              className="px-5 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Icon name={copied ? "Check" : "Copy"} size={15} />
              {copied ? "Готово" : "Копировать"}
            </button>
          </div>
          <p className="text-xs text-white/30">Твой код: <span className="text-white/50 font-mono">{user!.referral_code}</span></p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="glass rounded-xl border border-white/5 p-5 text-center">
            <p className="text-3xl font-display font-bold text-primary">{user!.bonus_generations}</p>
            <p className="text-xs text-white/40 mt-1">Бонусов получено</p>
          </div>
          <div className="glass rounded-xl border border-white/5 p-5 text-center">
            <p className="text-3xl font-display font-bold text-white/60">∞</p>
            <p className="text-xs text-white/40 mt-1">Лимита на рефералов нет</p>
          </div>
        </div>
      </div>
    </div>
  );
}