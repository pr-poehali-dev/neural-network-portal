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

type Mode = "generate" | "convert";

export default function ScenarioTool() {
  const [mode, setMode] = useState<Mode>("generate");
  const [topic, setTopic] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [platform, setPlatform] = useState("Reels");
  const [duration, setDuration] = useState("60 секунд");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (mode === "generate" && !topic.trim()) { toast.error("Введите тему видео"); return; }
    if (mode === "convert" && !sourceText.trim()) { toast.error("Вставьте текст для конвертации"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    setResult("");
    try {
      let data;
      if (mode === "generate") {
        data = await generateApi.scenario(topic, platform, duration);
        await toolsApi.saveGeneration("scenario", topic, undefined, { platform, duration });
      } else {
        data = await generateApi.scenarioConvert(sourceText, platform, duration);
        await toolsApi.saveGeneration("scenario", sourceText.slice(0, 100), undefined, { platform, duration, mode: "convert" });
      }
      setResult(data.result);
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
            {/* Tab switcher */}
            <div className="flex gap-2">
              <button
                onClick={() => { setMode("generate"); setResult(""); }}
                className={`px-4 py-2 text-sm rounded-lg transition-all font-medium ${
                  mode === "generate"
                    ? "bg-primary text-black font-medium"
                    : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                <Icon name="Clapperboard" size={14} className="inline mr-1.5 -mt-0.5" />
                Создать сценарий
              </button>
              <button
                onClick={() => { setMode("convert"); setResult(""); }}
                className={`px-4 py-2 text-sm rounded-lg transition-all font-medium ${
                  mode === "convert"
                    ? "bg-primary text-black font-medium"
                    : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                <Icon name="RefreshCw" size={14} className="inline mr-1.5 -mt-0.5" />
                Конвертировать текст
              </button>
            </div>

            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              {mode === "generate" ? (
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Тема видео <span className="text-primary">*</span></label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Например: Как я заработал первый миллион в 25 лет"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">
                    Вставьте текст для конвертации <span className="text-primary">*</span>
                  </label>
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder={"Вставьте статью, пост, заметку или любой текст — ИИ превратит его в готовый сценарий для видео"}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                    style={{ minHeight: "150px" }}
                  />
                  <p className="text-xs text-white/25 mt-1">ИИ адаптирует структуру, добавит крючки и CTA под выбранный формат</p>
                </div>
              )}

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
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all ${duration === d ? "bg-primary text-black font-medium" : "bg-white/5 text-white/40 hover:text-white"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={() => generate(onGenerate)} disabled={loading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                {loading
                  ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую...</>
                  : mode === "generate"
                    ? <><Icon name="Clapperboard" size={16} className="mr-2" />Создать сценарий</>
                    : <><Icon name="RefreshCw" size={16} className="mr-2" />Конвертировать в сценарий</>
                }
              </Button>
            </div>

            <ResultBox result={result} loading={loading} label="Сценарий" />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
