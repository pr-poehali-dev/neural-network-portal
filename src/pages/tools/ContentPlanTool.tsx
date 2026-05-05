import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

export default function ContentPlanTool() {
  const [niche, setNiche] = useState("");
  const [period, setPeriod] = useState("месяц");
  const [goals, setGoals] = useState("рост подписчиков");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!niche.trim()) { toast.error("Введите вашу нишу"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.contentPlan(niche, period, goals);
      setResult(data.result);
      await toolsApi.saveGeneration("content-plan", niche, undefined, { period, goals });
      toast.success("Контент-план готов!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="content-plan" title="Контент-план" description="Таблица постов на месяц для вашей ниши" icon="CalendarDays">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Ваша ниша <span className="text-primary">*</span></label>
                <Input value={niche} onChange={(e) => setNiche(e.target.value)}
                  placeholder="Например: онлайн-школа по нутрициологии, fashion блог, строительство домов"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
                <p className="text-xs text-white/25 mt-1">Подсказка: укажи конкретную тематику для точного плана</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Период</label>
                  <div className="flex gap-2">
                    {["неделя", "месяц", "квартал"].map((p) => (
                      <button key={p} onClick={() => setPeriod(p)}
                        className={`px-3 py-1.5 text-xs rounded-lg flex-1 transition-all ${period === p ? "bg-primary text-black font-medium" : "bg-white/5 text-white/50 hover:text-white"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Цель</label>
                  <Input value={goals} onChange={(e) => setGoals(e.target.value)}
                    placeholder="рост подписчиков, продажи, охваты"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25 text-sm" />
                </div>
              </div>
              <Button onClick={() => generate(onGenerate)} disabled={loading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                {loading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую...</> : <><Icon name="CalendarDays" size={16} className="mr-2" />Создать контент-план</>}
              </Button>
            </div>
            <ResultBox result={result} loading={loading} label="Контент-план (таблица)" />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
