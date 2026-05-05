import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const STYLES = ["Серьёзный", "Дружелюбный", "Премиум", "Молодёжный", "Минимализм"];

interface NamingCard {
  name: string;
  slogan: string;
  description: string;
}

export default function NamingTool() {
  const [businessType, setBusinessType] = useState("");
  const [niche, setNiche] = useState("");
  const [style, setStyle] = useState("Дружелюбный");
  const [targetAudience, setTargetAudience] = useState("");
  const [withSlogan, setWithSlogan] = useState(true);
  const [result, setResult] = useState("");
  const [cards, setCards] = useState<NamingCard[] | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!businessType.trim()) { toast.error("Введите тип бизнеса или продукта"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    setCards(null);
    setResult("");
    try {
      const data = await generateApi.naming(businessType, niche, style, targetAudience, withSlogan);
      setResult(data.result);
      try {
        const raw = data.result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCards(parsed as NamingCard[]);
        }
      } catch {
        // fallback to ResultBox
      }
      await toolsApi.saveGeneration("naming", businessType, undefined, { niche, style, target_audience: targetAudience, with_slogan: withSlogan });
      toast.success("Названия готовы!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(result);
    toast.success("Всё скопировано!");
  };

  const copyName = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.success("Название скопировано!");
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="naming" title="Генератор названий и слоганов" description="Уникальные названия и слоганы для вашего бизнеса" icon="Sparkles">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Тип бизнеса / продукта <span className="text-primary">*</span>
                </label>
                <Input
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="Например: кофейня, онлайн-школа, фотостудия"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Ниша / сфера</label>
                <Input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Например: здоровое питание, IT, красота и уход"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Целевая аудитория</label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Например: молодые мамы, предприниматели 25–40 лет"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Стиль</label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        style === s
                          ? "bg-primary text-black font-medium"
                          : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-white/60">Нужен слоган</label>
                <button
                  onClick={() => setWithSlogan((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-all ${withSlogan ? "bg-primary" : "bg-white/10"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${withSlogan ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>

              <Button
                onClick={() => generate(onGenerate)}
                disabled={loading}
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90"
              >
                {loading ? (
                  <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую...</>
                ) : (
                  <><Icon name="Sparkles" size={16} className="mr-2" />Сгенерировать</>
                )}
              </Button>
            </div>

            {loading && (
              <div className="glass rounded-xl border border-white/5 p-8 flex items-center justify-center gap-3 text-white/30">
                <Icon name="Loader2" size={20} className="animate-spin" />
                <span className="text-sm">Генерирую названия...</span>
              </div>
            )}

            {!loading && cards && cards.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Варианты названий</span>
                  <button
                    onClick={copyAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Icon name="Copy" size={13} />
                    Копировать всё
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {cards.map((card, i) => (
                    <div key={i} className="glass rounded-xl p-5 border border-white/5 space-y-3 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xl font-bold text-primary leading-tight">{card.name}</span>
                        <button
                          onClick={() => copyName(card.name)}
                          className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Icon name="Copy" size={12} />
                          Копировать
                        </button>
                      </div>
                      {card.slogan && (
                        <p className="text-sm italic text-white/60 leading-snug">"{card.slogan}"</p>
                      )}
                      {card.description && (
                        <p className="text-xs text-white/40 leading-relaxed mt-auto pt-1">{card.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && result && !cards && (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={copyAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Icon name="Copy" size={13} />
                    Копировать всё
                  </button>
                </div>
                <ResultBox result={result} loading={false} label="Названия и слоганы" />
              </>
            )}
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
