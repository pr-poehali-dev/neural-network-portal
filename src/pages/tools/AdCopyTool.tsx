import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const PLATFORMS = ["Яндекс.Директ", "VK Реклама", "Telegram Ads", "MyTarget"];
const GOALS = ["Продажи", "Лиды", "Трафик", "Узнаваемость", "Установки приложения"];

interface AdCard {
  title: string;
  text: string;
  cta: string;
  tip: string;
}

export default function AdCopyTool() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState("Яндекс.Директ");
  const [goal, setGoal] = useState("Продажи");
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState("");
  const [cards, setCards] = useState<AdCard[] | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!product.trim()) { toast.error("Введите продукт или услугу"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    setCards(null);
    setResult("");
    try {
      const data = await generateApi.adCopy(product, audience, platform, goal, budget);
      setResult(data.result);
      try {
        const raw = data.result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCards(parsed as AdCard[]);
        }
      } catch {
        // fallback to ResultBox
      }
      await toolsApi.saveGeneration("ad-copy", product, undefined, { audience, platform, goal, budget });
      toast.success("Объявления готовы!");
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

  const copyCard = (card: AdCard) => {
    const text = `${card.title}\n\n${card.text}\n\n${card.cta}`;
    navigator.clipboard.writeText(text);
    toast.success("Объявление скопировано!");
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="ad-copy" title="Рекламные объявления" description="Конверсионные тексты для любой рекламной платформы" icon="Megaphone">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Продукт / услуга <span className="text-primary">*</span>
                </label>
                <Input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="Например: курс по Python, доставка еды, ремонт квартир"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Целевая аудитория</label>
                <Input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Например: мужчины 25–45, интересуются авто"
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

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Цель рекламы</label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGoal(g)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        goal === g
                          ? "bg-primary text-black font-medium"
                          : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Бюджет (необязательно)</label>
                <Input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Например: 50 000 ₽/мес, 500 ₽/день"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <Button
                onClick={() => generate(onGenerate)}
                disabled={loading}
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90"
              >
                {loading ? (
                  <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Создаю объявления...</>
                ) : (
                  <><Icon name="Megaphone" size={16} className="mr-2" />Создать объявления</>
                )}
              </Button>
            </div>

            {loading && (
              <div className="glass rounded-xl border border-white/5 p-8 flex items-center justify-center gap-3 text-white/30">
                <Icon name="Loader2" size={20} className="animate-spin" />
                <span className="text-sm">Создаю объявления...</span>
              </div>
            )}

            {!loading && cards && cards.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Варианты объявлений</span>
                  <button
                    onClick={copyAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Icon name="Copy" size={13} />
                    Копировать всё
                  </button>
                </div>
                <div className="space-y-3">
                  {cards.map((card, i) => (
                    <div key={i} className="glass rounded-xl p-5 border border-white/5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 flex-1">
                          <p className="text-base font-bold text-primary leading-snug">{card.title}</p>
                          <p className="text-sm text-white/70 leading-relaxed">{card.text}</p>
                          {card.cta && (
                            <span className="inline-block px-3 py-1 text-xs rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
                              {card.cta}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => copyCard(card)}
                          className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Icon name="Copy" size={12} />
                          Копировать
                        </button>
                      </div>
                      {card.tip && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/5">
                          <Icon name="Lightbulb" size={13} className="text-primary/70 mt-0.5 shrink-0" />
                          <p className="text-xs text-white/40 leading-relaxed">{card.tip}</p>
                        </div>
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
                <ResultBox result={result} loading={false} label="Рекламные объявления" />
              </>
            )}
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
