import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const PLATFORMS = ["Instagram", "VKontakte", "Telegram", "TikTok", "YouTube"];

export default function FunnelTool() {
  const [platform, setPlatform] = useState("Instagram");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!product.trim()) { toast.error("Введите ваш продукт или услугу"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.funnel(platform, product, audience);
      setResult(data.result);
      await toolsApi.saveGeneration("funnel", product, undefined, { platform, audience, result });
      toast.success("Воронка готова!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="funnel" title="Воронки продаж" description="Продающие воронки для каждой соцсети" icon="TrendingUp">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Платформа</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button key={p} onClick={() => setPlatform(p)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${platform === p ? "bg-primary text-black font-medium" : "bg-white/5 text-white/50 hover:text-white"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Продукт или услуга <span className="text-primary">*</span></label>
                <Input value={product} onChange={(e) => setProduct(e.target.value)}
                  placeholder="Например: онлайн-курс по похудению, дизайн интерьеров, юридические услуги"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Целевая аудитория</label>
                <Input value={audience} onChange={(e) => setAudience(e.target.value)}
                  placeholder="Например: женщины 25-40 лет, молодые мамы, малый бизнес"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
              </div>
              <Button onClick={() => generate(onGenerate)} disabled={loading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                {loading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Создаю воронку...</> : <><Icon name="TrendingUp" size={16} className="mr-2" />Создать воронку</>}
              </Button>
            </div>
            <ResultBox result={result} loading={loading} label="Воронка продаж" />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}