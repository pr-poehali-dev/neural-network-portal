import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { generateApi } from "@/lib/api";
import { toast } from "sonner";

export default function RouletteTool() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const spin = async () => {
    setLoading(true);
    try {
      const data = await generateApi.roulette();
      setPrompt(data.prompt);
    } catch {
      toast.error("Не удалось получить промт");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success("Промт скопирован!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="roulette" title="Фото-рулетка" description="Случайные промты для реалистичных фото" icon="Shuffle">
        {() => (
          <div className="space-y-6">
            <div className="glass rounded-xl border border-white/5 overflow-hidden">
              <div className="p-8 text-center">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/20 flex items-center justify-center mx-auto mb-6 transition-transform duration-300 ${loading ? "animate-spin" : ""}`}>
                  <Icon name="Shuffle" size={32} className="text-rose-400" />
                </div>

                {prompt ? (
                  <div className="space-y-4">
                    <p className="text-white/80 text-base leading-relaxed max-w-lg mx-auto">{prompt}</p>
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <Button onClick={copy} variant="outline" size="sm"
                        className="border-white/20 text-white/60 hover:text-white">
                        <Icon name={copied ? "Check" : "Copy"} size={14} className="mr-1" />
                        {copied ? "Скопировано" : "Скопировать"}
                      </Button>
                      <Button onClick={spin} size="sm" className="bg-primary text-black hover:bg-primary/90">
                        <Icon name="Shuffle" size={14} className="mr-1" />
                        Ещё идея
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-white/40 text-sm">Нажми кнопку и получи идею для крутого фото</p>
                    <Button onClick={spin} disabled={loading}
                      className="bg-primary text-black font-semibold hover:bg-primary/90 px-8">
                      {loading ? "Выбираю..." : "Крутить рулетку"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="glass rounded-xl p-5 border border-white/5">
              <p className="tag-pill text-white/30 mb-4 text-xs">КАК ИСПОЛЬЗОВАТЬ</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: "Shuffle", step: "1", text: "Нажми на рулетку — получи случайный промт" },
                  { icon: "Copy", step: "2", text: "Скопируй текст и вставь в генератор изображений" },
                  { icon: "ImagePlus", step: "3", text: "Создай изображение в разделе Генерация изображений" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-xs font-bold">{item.step}</span>
                    </div>
                    <p className="text-sm text-white/40">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
