import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const GUIDE_TYPES = ["гайд", "чеклист", "инструкция", "мини-книга", "FAQ"];

export default function GuideTool() {
  const [topic, setTopic] = useState("");
  const [guideType, setGuideType] = useState("гайд");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!topic.trim()) { toast.error("Введите тему"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.guide(topic, guideType);
      setResult(data.result);
      await toolsApi.saveGeneration("guide", topic, undefined, { guide_type: guideType, result });
      toast.success("Документ готов!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="guide" title="Гайды и чеклисты" description="Красиво оформленные обучающие документы" icon="BookOpen">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Тип документа</label>
                <div className="flex flex-wrap gap-2">
                  {GUIDE_TYPES.map((g) => (
                    <button key={g} onClick={() => setGuideType(g)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all capitalize ${guideType === g ? "bg-primary text-black font-medium" : "bg-white/5 text-white/50 hover:text-white"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Тема <span className="text-primary">*</span></label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: Как набрать первые 1000 подписчиков в Instagram"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
                <p className="text-xs text-white/25 mt-1">Результат будет структурирован с разделами и подразделами</p>
              </div>
              <Button onClick={() => generate(onGenerate)} disabled={loading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                {loading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Создаю документ...</> : <><Icon name="BookOpen" size={16} className="mr-2" />Создать {guideType}</>}
              </Button>
            </div>
            <ResultBox result={result} loading={loading} label={`Готовый ${guideType}`} />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}