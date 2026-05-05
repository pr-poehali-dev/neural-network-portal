import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const PURPOSES = ["Приветственное", "Продающее", "Прогрев", "Реактивация", "Анонс", "Благодарность"];
const TONES = ["Дружелюбный", "Экспертный", "Срочность", "Мягкий"];

export default function EmailTool() {
  const [purpose, setPurpose] = useState("Продающее");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("Дружелюбный");
  const [chain, setChain] = useState(false);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!product.trim()) { toast.error("Введите продукт, услугу или тему письма"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.emailCopy(purpose, product, audience, tone, chain);
      setResult(data.result);
      await toolsApi.saveGeneration("email-copy", product, undefined, { purpose, audience, tone, chain });
      toast.success(chain ? "Цепочка писем готова!" : "Письмо готово!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="email-copy" title="Email-копирайтер" description="Продающие письма и цепочки для любых целей" icon="Mail">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Тип письма</label>
                <div className="flex flex-wrap gap-2">
                  {PURPOSES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPurpose(p)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        purpose === p
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
                <label className="text-sm text-white/60 mb-1.5 block">
                  Продукт/услуга/тема <span className="text-primary">*</span>
                </label>
                <Input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="Например: онлайн-курс по инвестициям, вебинар по SMM, новая коллекция одежды"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Аудитория</label>
                <Input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Например: подписчики курса, холодная база, существующие клиенты"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Тон письма</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        tone === t
                          ? "bg-primary text-black font-medium"
                          : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={() => setChain(!chain)}
                  className="flex items-center gap-3 w-full group"
                >
                  <div className={`w-10 h-5 rounded-full transition-all flex items-center px-0.5 ${chain ? "bg-primary" : "bg-white/10"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${chain ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                  <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                    Создать цепочку из 3 писем
                  </span>
                </button>
              </div>

              <Button
                onClick={() => generate(onGenerate)}
                disabled={loading}
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90"
              >
                {loading ? (
                  <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Пишу{chain ? " цепочку" : " письмо"}...</>
                ) : (
                  <><Icon name="Mail" size={16} className="mr-2" />Написать {chain ? "цепочку" : "письмо"}</>
                )}
              </Button>
            </div>

            <ResultBox result={result} loading={loading} label={chain ? "Цепочка писем" : "Email-письмо"} />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
