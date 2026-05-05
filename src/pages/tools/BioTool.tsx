import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const PLATFORMS = ["Instagram", "TikTok", "VK", "Telegram"];
const TONES = ["экспертный", "дружелюбный", "продающий", "вдохновляющий"];

export default function BioTool() {
  const [niche, setNiche] = useState("");
  const [keywords, setKeywords] = useState("");
  const [contact, setContact] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("экспертный");
  const [variants, setVariants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!niche.trim()) { toast.error("Введите вашу нишу"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.bioGenerator(niche, keywords, contact, platform, tone);
      setVariants(data.variants);
      await toolsApi.saveGeneration("bio-generator", niche, undefined, { platform, tone, variants: data.variants });
      toast.success("Варианты шапки готовы!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const copyVariant = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    toast.success(`Вариант ${index + 1} скопирован!`);
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="bio-generator" title="Генератор шапки профиля" description="Продающее описание профиля за несколько секунд" icon="UserCircle">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Ваша ниша / чем занимаетесь <span className="text-primary">*</span>
                </label>
                <Input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Например: нутрициолог, помогаю похудеть без диет"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Ключевые слова (через запятую)</label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Например: похудение, ПП, онлайн-консультации"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Ссылка / контакт (необязательно)</label>
                <Input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Например: t.me/username или +7 999 000-00-00"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
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

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Тон</label>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                          tone === t
                            ? "bg-white/20 text-white font-medium"
                            : "bg-white/5 text-white/40 hover:text-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
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
                  <><Icon name="Sparkles" size={16} className="mr-2" />Создать шапку профиля</>
                )}
              </Button>
            </div>

            {variants.length > 0 && (
              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    className="glass rounded-xl p-5 border border-white/5 flex items-start gap-4"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed flex-1 whitespace-pre-wrap">{variant}</p>
                    <button
                      onClick={() => copyVariant(variant, index)}
                      className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                      title="Копировать"
                    >
                      <Icon name="Copy" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
