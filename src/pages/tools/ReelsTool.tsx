import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

export default function ReelsTool() {
  const [description, setDescription] = useState("");
  const [views, setViews] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!description.trim()) { toast.error("Введите описание видео"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.reelsAnalysis(description, Number(views) || 0, Number(likes) || 0, Number(comments) || 0);
      setResult(data.result);
      await toolsApi.saveGeneration("reels", description, undefined, { views, likes, comments, result });
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
      <ToolWrapper toolSlug="reels" title="Аналитика Reels" description="Разбор видео и рекомендации по улучшению" icon="FileVideo">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Описание видео <span className="text-primary">*</span></label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="О чём видео? Тема, формат, основное сообщение..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
                <p className="text-xs text-white/25 mt-1">Подсказка: укажи тему, хук и основную идею видео</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Просмотры", val: views, set: setViews, placeholder: "12500" },
                  { label: "Лайки", val: likes, set: setLikes, placeholder: "480" },
                  { label: "Комментарии", val: comments, set: setComments, placeholder: "32" },
                ].map(({ label, val, set, placeholder }) => (
                  <div key={label}>
                    <label className="text-sm text-white/60 mb-1.5 block">{label}</label>
                    <Input value={val} onChange={(e) => set(e.target.value)} type="number"
                      placeholder={placeholder}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 text-sm" />
                  </div>
                ))}
              </div>
              <Button onClick={() => generate(onGenerate)} disabled={loading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                {loading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Анализирую...</> : <><Icon name="FileVideo" size={16} className="mr-2" />Анализировать видео</>}
              </Button>
            </div>
            <ResultBox result={result} loading={loading} label="Аналитика и рекомендации" />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}