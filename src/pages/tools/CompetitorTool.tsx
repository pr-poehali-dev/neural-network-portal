import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const ANALYSIS_TYPES = ["SWOT-анализ", "Контент-стратегия", "Ценовое позиционирование", "Аудитория"];

const QUICK_ACTIONS = [
  { label: "Идеи для отстройки", icon: "Zap", prompt: "отстройка" },
  { label: "Контент который обходит конкурентов", icon: "TrendingUp", prompt: "контент" },
  { label: "Уникальное предложение", icon: "Star", prompt: "уникальное предложение" },
];

export default function CompetitorTool() {
  const [niche, setNiche] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [myStrengths, setMyStrengths] = useState("");
  const [analysisType, setAnalysisType] = useState("SWOT-анализ");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState<string | null>(null);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!niche.trim()) { toast.error("Введите вашу нишу"); return; }
    if (!competitors.trim()) { toast.error("Укажите хотя бы одного конкурента"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.competitorAnalysis(niche, competitors, myStrengths, analysisType);
      setResult(data.result);
      await toolsApi.saveGeneration("competitor-analysis", niche, undefined, { competitors, my_strengths: myStrengths, analysis_type: analysisType });
      toast.success("Анализ готов!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const runQuickAction = async (actionPrompt: string, actionLabel: string) => {
    if (!result) { toast.error("Сначала выполните основной анализ"); return; }
    setQuickLoading(actionPrompt);
    try {
      const enrichedNiche = `${niche}. На основе анализа: ${result.slice(0, 500)}`;
      const data = await generateApi.competitorAnalysis(enrichedNiche, competitors, myStrengths, actionLabel);
      setResult(data.result);
      toast.success("Готово!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setQuickLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="competitor-analysis" title="Анализатор конкурентов" description="Детальный разбор конкурентов и стратегия обхода" icon="Search">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Ваша ниша <span className="text-primary">*</span>
                </label>
                <Input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Например: онлайн-образование для детей, фитнес-тренер, кофейня"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Конкуренты <span className="text-primary">*</span>
                  <span className="ml-1 font-normal text-white/30">(по одному на строку, можно указать Instagram/сайт)</span>
                </label>
                <textarea
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  placeholder={"@competitor1\n@competitor2\ncompetitor-site.ru"}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                  style={{ minHeight: "100px" }}
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Ваши сильные стороны</label>
                <Input
                  value={myStrengths}
                  onChange={(e) => setMyStrengths(e.target.value)}
                  placeholder="Например: опыт 10 лет, авторская методика, живые отзывы, быстрый результат"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Тип анализа</label>
                <div className="flex flex-wrap gap-2">
                  {ANALYSIS_TYPES.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAnalysisType(a)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        analysisType === a
                          ? "bg-primary text-black font-medium"
                          : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {a}
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
                  <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Анализирую...</>
                ) : (
                  <><Icon name="Search" size={16} className="mr-2" />Проанализировать</>
                )}
              </Button>
            </div>

            <ResultBox result={result} loading={loading} label="Анализ конкурентов" />

            {result && !loading && (
              <div className="glass rounded-xl p-5 border border-white/5 space-y-3">
                <p className="text-sm text-white/50 font-medium">Быстрые действия</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.prompt}
                      onClick={() => runQuickAction(action.prompt, action.label)}
                      disabled={quickLoading !== null}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {quickLoading === action.prompt ? (
                        <Icon name="Loader2" size={13} className="animate-spin" />
                      ) : (
                        <Icon name={action.icon as Parameters<typeof Icon>[0]["name"]} size={13} />
                      )}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
