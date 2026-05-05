import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import type { HashtagResult } from "@/lib/api";
import { toast } from "sonner";

const PLATFORMS = ["Instagram", "TikTok", "VK", "YouTube"];

const COLUMNS: { key: keyof Pick<HashtagResult, "high" | "medium" | "low">; label: string; dot: string }[] = [
  { key: "high",   label: "Высокочастотные",   dot: "bg-red-500" },
  { key: "medium", label: "Среднечастотные",   dot: "bg-yellow-400" },
  { key: "low",    label: "Низкочастотные",    dot: "bg-green-500" },
];

export default function HashtagTool() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [result, setResult] = useState<HashtagResult | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!topic.trim()) { toast.error("Введите тему или нишу"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.hashtags(topic, platform);
      setResult(data);
      await toolsApi.saveGeneration("hashtags", topic, undefined, { platform, result: data });
      toast.success("Хэштеги готовы!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const copyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    toast.success(`Скопировано: ${tag}`);
  };

  const copyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.all.join(" "));
    toast.success("Все 30 хэштегов скопированы!");
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="hashtags" title="Хэштег-анализатор" description="Подбор хэштегов по частотности для любой платформы" icon="Hash">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Тема или ниша <span className="text-primary">*</span>
                </label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: фитнес для начинающих, кулинария, SMM"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Платформа</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        platform === p
                          ? "bg-primary text-black font-medium"
                          : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => generate(onGenerate)}
                disabled={loading}
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90"
              >
                {loading ? (
                  <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую...</>
                ) : (
                  <><Icon name="Sparkles" size={16} className="mr-2" />Генерировать хэштеги</>
                )}
              </Button>
            </div>

            {result && (
              <div className="glass rounded-xl p-6 border border-white/5 space-y-5">
                <div className="grid sm:grid-cols-3 gap-4">
                  {COLUMNS.map(({ key, label, dot }) => (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0`} />
                        <span className="text-sm font-medium text-white/80">{label}</span>
                        <span className="text-xs text-white/30 ml-auto">{result[key].length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result[key].map((tag) => (
                          <button
                            key={tag}
                            onClick={() => copyTag(tag)}
                            title="Нажмите, чтобы скопировать"
                            className="px-2.5 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/5">
                  <Button
                    onClick={copyAll}
                    variant="outline"
                    className="w-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <Icon name="Copy" size={14} className="mr-2" />
                    Копировать все 30 хэштегов
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
