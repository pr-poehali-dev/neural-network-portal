import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

export default function PresentationTool() {
  const [topic, setTopic] = useState("");
  const [slidesCount, setSlidesCount] = useState(10);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!topic.trim()) { toast.error("Введите тему презентации"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.presentation(topic, slidesCount);
      setResult(data.result);
      await toolsApi.saveGeneration("presentation", topic, undefined, { slides_count: slidesCount, result });
      toast.success("Презентация готова!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="presentation" title="Генерация презентаций" description="Структура слайдов с ИИ" icon="Presentation">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Тема презентации <span className="text-primary">*</span></label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: Стратегия продвижения в Instagram на 2025 год"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Количество слайдов: <span className="text-primary">{slidesCount}</span></label>
                <input type="range" min={5} max={20} value={slidesCount}
                  onChange={(e) => setSlidesCount(Number(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-white/30 mt-1"><span>5</span><span>20</span></div>
              </div>
              <Button onClick={() => generate(onGenerate)} disabled={loading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                {loading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую...</> : <><Icon name="Presentation" size={16} className="mr-2" />Создать презентацию</>}
              </Button>
            </div>
            <ResultBox result={result} loading={loading} label="Структура презентации" />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}