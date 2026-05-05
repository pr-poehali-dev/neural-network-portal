import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const PLATFORMS = ["Reels", "TikTok", "YouTube Shorts", "ВКонтакте Клипы"];
const DURATIONS = ["15 секунд", "30 секунд", "60 секунд", "90 секунд", "3 минуты"];

export default function ScenarioTool() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Reels");
  const [duration, setDuration] = useState("60 секунд");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!topic.trim()) { toast.error("Введите тему видео"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.scenario(topic, platform, duration);
      setResult(data.result);
      await toolsApi.saveGeneration("scenario", topic, undefined, { platform, duration });
      toast.success("Сценарий готов!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="scenario" title="Сценарии для видео" description="Детальные сценарии для Reels и TikTok" icon="Clapperboard">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Тема видео <span className="text-primary">*</span></label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: Как я заработал первый миллион в 25 лет"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
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
                  <label className="text-sm text-white/60 mb-1.5 block">Длительность</label>
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map((d) => (
                      <button key={d} onClick={() => setDuration(d)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all ${duration === d ? "bg-white/20 text-white font-medium" : "bg-white/5 text-white/40 hover:text-white"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={() => generate(onGenerate)} disabled={loading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                {loading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую...</> : <><Icon name="Clapperboard" size={16} className="mr-2" />Создать сценарий</>}
              </Button>
            </div>
            <ResultBox result={result} loading={loading} label="Сценарий" />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
