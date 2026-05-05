import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

export default function CarouselTool() {
  const [topic, setTopic] = useState("");
  const [slidesCount, setSlidesCount] = useState(7);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!topic.trim()) { toast.error("Введите тему карусели"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.carousel(topic, slidesCount);
      setResult(data.result);
      await toolsApi.saveGeneration("carousel", topic, undefined, { slides_count: slidesCount, result });
      toast.success("Карусель готова!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="carousel" title="Пост-карусель" description="Структура карусели для Instagram" icon="LayoutTemplate">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Тема карусели <span className="text-primary">*</span></label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: 7 ошибок начинающих предпринимателей"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
                <p className="text-xs text-white/25 mt-1">Подсказка: используй формат "N советов/ошибок/шагов" для лучшего результата</p>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Количество слайдов: <span className="text-primary font-medium">{slidesCount}</span></label>
                <input
                  type="range"
                  min={5}
                  max={15}
                  value={slidesCount}
                  onChange={(e) => setSlidesCount(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>5 слайдов</span>
                  <span>15 слайдов</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/30 bg-primary/5 border border-primary/10 rounded-lg p-3">
                <Icon name="Gift" size={14} className="text-primary" />
                <span>Первая генерация — бесплатно!</span>
              </div>

              <Button
                onClick={() => generate(onGenerate)}
                disabled={loading}
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90"
              >
                {loading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую...</> : <><Icon name="LayoutTemplate" size={16} className="mr-2" />Создать карусель</>}
              </Button>
            </div>

            <ResultBox result={result} loading={loading} label="Структура карусели" />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}