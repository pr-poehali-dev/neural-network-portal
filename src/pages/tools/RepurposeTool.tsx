import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const FORMATS: { id: string; label: string; icon: string }[] = [
  { id: "instagram_post",  label: "Пост Instagram",         icon: "Instagram" },
  { id: "carousel",        label: "Карусель (тезисы)",      icon: "LayoutTemplate" },
  { id: "stories",         label: "Сторис (3 части)",       icon: "Layers" },
  { id: "email",           label: "Email-рассылка",         icon: "Mail" },
  { id: "dzen_headline",   label: "Заголовок для Дзена",    icon: "Newspaper" },
  { id: "telegram_thread", label: "Thread для Telegram",    icon: "MessageSquare" },
];

export default function RepurposeTool() {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<string[]>(["instagram_post"]);
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const toggleFormat = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!text.trim()) { toast.error("Вставьте текст для переупаковки"); return; }
    if (selected.length === 0) { toast.error("Выберите хотя бы один формат"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.repurpose(text, selected);
      setResults(data.results);
      await toolsApi.saveGeneration("repurpose", text.slice(0, 200), undefined, { formats: selected, results: data.results });
      toast.success("Контент переупакован!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = (id: string) => {
    navigator.clipboard.writeText(results[id]);
    const fmt = FORMATS.find((f) => f.id === id);
    toast.success(`Скопировано: ${fmt?.label}`);
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="repurpose" title="Переупаковщик контента" description="Один текст — несколько форматов для разных площадок" icon="RefreshCw">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Вставьте ваш текст / статью / пост <span className="text-primary">*</span>
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Вставьте исходный текст, который нужно переупаковать в разные форматы..."
                  rows={6}
                  className="w-full min-h-[150px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm px-3 py-2.5 resize-y outline-none focus:border-primary/50 transition-colors"
                />
                <p className="text-xs text-white/25 mt-1">
                  Подсказка: чем подробнее текст — тем качественнее переупаковка
                </p>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">Выберите форматы на выходе</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FORMATS.map(({ id, label, icon }) => {
                    const active = selected.includes(id);
                    return (
                      <button
                        key={id}
                        onClick={() => toggleFormat(id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all border ${
                          active
                            ? "bg-primary/15 border-primary/40 text-primary font-medium"
                            : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <Icon name={icon as Parameters<typeof Icon>[0]["name"]} size={13} className="shrink-0" />
                        <span>{label}</span>
                        {active && (
                          <Icon name="Check" size={12} className="ml-auto shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {selected.length > 0 && (
                  <p className="text-xs text-white/30 mt-2">
                    Выбрано форматов: {selected.length}
                  </p>
                )}
              </div>

              <Button
                onClick={() => generate(onGenerate)}
                disabled={loading}
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90"
              >
                {loading ? (
                  <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Переупаковываю...</>
                ) : (
                  <><Icon name="Sparkles" size={16} className="mr-2" />Переупаковать контент</>
                )}
              </Button>
            </div>

            {Object.keys(results).length > 0 && (
              <div className="space-y-3">
                {FORMATS.filter((f) => results[f.id]).map(({ id, label, icon }) => (
                  <div key={id} className="glass rounded-xl p-5 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                          <Icon name={icon as Parameters<typeof Icon>[0]["name"]} size={14} className="text-primary" />
                        </div>
                        <span className="text-sm font-medium text-white/80">{label}</span>
                      </div>
                      <button
                        onClick={() => copyResult(id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-xs transition-all"
                      >
                        <Icon name="Copy" size={12} />
                        Копировать
                      </button>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap border-t border-white/5 pt-3">
                      {results[id]}
                    </p>
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
