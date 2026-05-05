import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const CASE_TYPES = ["Кейс (до/после)", "Отзыв клиента", "История успеха", "Мини-кейс для поста"];
const STYLES = ["Деловой", "Живой рассказ", "С эмоциями", "Цифры и факты"];

export default function CaseTool() {
  const [caseType, setCaseType] = useState("Кейс (до/после)");
  const [clientName, setClientName] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [resultText, setResultText] = useState("");
  const [metrics, setMetrics] = useState("");
  const [style, setStyle] = useState("Деловой");
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!problem.trim()) { toast.error("Опишите проблему или задачу клиента"); return; }
    if (!solution.trim()) { toast.error("Опишите ваше решение"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.caseGenerator(caseType, clientName, problem, solution, resultText, metrics, style);
      setGeneratedText(data.result);
      await toolsApi.saveGeneration("case-generator", problem, undefined, { case_type: caseType, client_name: clientName, result_text: resultText, metrics, style });
      toast.success("Кейс готов!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="case-generator" title="Генератор кейсов и отзывов" description="Убедительные кейсы и отзывы для продвижения" icon="Award">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Тип материала</label>
                <div className="flex flex-wrap gap-2">
                  {CASE_TYPES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCaseType(c)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        caseType === c
                          ? "bg-primary text-black font-medium"
                          : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Имя/тип клиента (можно обезличить)</label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Например: Анна, 35 лет / Владелец бизнеса / Клиент N"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Проблема/задача клиента <span className="text-primary">*</span>
                </label>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Опишите с чем пришёл клиент, какая была ситуация до начала работы"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                  style={{ minHeight: "70px" }}
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Ваше решение <span className="text-primary">*</span>
                </label>
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Что вы сделали, какой подход применили, какие инструменты использовали"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                  style={{ minHeight: "70px" }}
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Результат (с цифрами если есть)</label>
                <Input
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder="Например: похудела на 8 кг за 2 месяца, выручка выросла на 40%"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Метрики успеха (необязательно)</label>
                <Input
                  value={metrics}
                  onChange={(e) => setMetrics(e.target.value)}
                  placeholder="Например: ROI 320%, NPS 9.2, срок работы 3 недели"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Стиль подачи</label>
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

              <Button
                onClick={() => generate(onGenerate)}
                disabled={loading}
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90"
              >
                {loading ? (
                  <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Создаю кейс...</>
                ) : (
                  <><Icon name="Award" size={16} className="mr-2" />Создать кейс</>
                )}
              </Button>
            </div>

            <ResultBox result={generatedText} loading={loading} label={caseType} />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
