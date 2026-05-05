import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const CHANNELS = ["Переписка", "Звонок", "Встреча", "Stories/Reels"];
const SCRIPT_TYPES = ["Холодный контакт", "Тёплый клиент", "Возврат клиента", "Допродажа"];

export default function SaleScriptTool() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [objections, setObjections] = useState("");
  const [channel, setChannel] = useState("Переписка");
  const [scriptType, setScriptType] = useState("Холодный контакт");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!product.trim()) { toast.error("Введите продукт или услугу"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.saleScript(product, audience, objections, channel, scriptType);
      setResult(data.result);
      await toolsApi.saveGeneration("sale-script", product, undefined, { audience, objections, channel, script_type: scriptType });
      toast.success("Скрипт продаж готов!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    toast.success("Скрипт скопирован!");
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="sale-script" title="Скрипт продаж" description="Эффективные скрипты для любого канала и типа клиента" icon="MessageSquare">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Продукт/услуга <span className="text-primary">*</span>
                </label>
                <Input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="Например: онлайн-курс по SMM, юридические услуги, дизайн интерьеров"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Целевая аудитория</label>
                <Input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Например: владельцы малого бизнеса, молодые мамы, фрилансеры"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Основные возражения клиентов</label>
                <textarea
                  value={objections}
                  onChange={(e) => setObjections(e.target.value)}
                  placeholder={"Например:\n— Дорого\n— Мне нужно подумать\n— Уже работаю с другими"}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                  style={{ minHeight: "80px" }}
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Канал</label>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setChannel(c)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        channel === c
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
                <label className="text-sm text-white/60 mb-1.5 block">Тип скрипта</label>
                <div className="flex flex-wrap gap-2">
                  {SCRIPT_TYPES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setScriptType(s)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        scriptType === s
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
                  <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Создаю скрипт...</>
                ) : (
                  <><Icon name="MessageSquare" size={16} className="mr-2" />Создать скрипт</>
                )}
              </Button>
            </div>

            {result && !loading && (
              <div className="flex justify-end">
                <button
                  onClick={copyResult}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Icon name="Copy" size={13} />
                  Копировать скрипт
                </button>
              </div>
            )}

            <ResultBox result={result} loading={loading} label="Скрипт продаж" />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
