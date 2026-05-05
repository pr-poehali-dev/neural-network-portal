import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

export default function ProfileTool() {
  const [niche, setNiche] = useState("");
  const [followers, setFollowers] = useState("");
  const [avgLikes, setAvgLikes] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!niche.trim()) { toast.error("Введите вашу нишу"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.profileAnalysis(niche, Number(followers) || 0, Number(avgLikes) || 0);
      setResult(data.result);
      await toolsApi.saveGeneration("profile", niche, undefined, { followers, avg_likes: avgLikes, result });
      toast.success("Анализ готов!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="profile" title="Анализ профиля" description="Разбор профиля и стратегия продвижения на 30 дней" icon="BarChart3">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Ваша ниша <span className="text-primary">*</span></label>
                <Input value={niche} onChange={(e) => setNiche(e.target.value)}
                  placeholder="Например: психология отношений, фитнес для женщин, handmade украшения"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Подписчиков</label>
                  <Input value={followers} onChange={(e) => setFollowers(e.target.value)} type="number"
                    placeholder="5000"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Средние лайки на пост</label>
                  <Input value={avgLikes} onChange={(e) => setAvgLikes(e.target.value)} type="number"
                    placeholder="150"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs text-white/30 bg-white/3 rounded-lg p-3">
                <Icon name="Info" size={13} className="text-white/40 mt-0.5 flex-shrink-0" />
                <span>ИИ создаст подробный разбор профиля и пошаговый план действий на 30 дней с конкретными рекомендациями</span>
              </div>
              <Button onClick={() => generate(onGenerate)} disabled={loading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                {loading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Анализирую...</> : <><Icon name="BarChart3" size={16} className="mr-2" />Анализировать профиль</>}
              </Button>
            </div>
            <ResultBox result={result} loading={loading} label="Анализ и стратегия" />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}