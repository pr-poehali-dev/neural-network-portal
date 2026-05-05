import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const BACKGROUNDS = [
  { id: "gradient_purple", label: "Фиолетовый градиент", prompt: "vibrant purple violet gradient background, smooth, no text" },
  { id: "gradient_sunset", label: "Закат",               prompt: "warm sunset gradient orange pink purple, beautiful, no text" },
  { id: "gradient_ocean",  label: "Океан",               prompt: "ocean blue teal gradient, calm water aesthetic, no text" },
  { id: "dark_abstract",   label: "Тёмный абстракт",     prompt: "dark abstract background, subtle geometric shapes, premium dark" },
  { id: "neon_grid",       label: "Неон-сетка",          prompt: "dark background neon grid lines, cyberpunk aesthetic, glowing" },
  { id: "bokeh_gold",      label: "Золотое боке",        prompt: "gold bokeh lights dark background, luxury aesthetic, blurred lights" },
  { id: "nature_green",    label: "Природа",             prompt: "lush green nature forest background, fresh, sunlight" },
  { id: "minimal_white",   label: "Минимализм",          prompt: "clean minimal white light grey background, simple elegant" },
  { id: "texture_paper",   label: "Бумага",              prompt: "paper texture background, vintage, warm cream beige" },
  { id: "space",           label: "Космос",              prompt: "space galaxy stars nebula background, deep purple blue" },
  { id: "city_night",      label: "Ночной город",        prompt: "night city lights bokeh background, urban aesthetic" },
  { id: "abstract_art",    label: "Абстрактное арт",     prompt: "colorful abstract art background, artistic brush strokes, vibrant" },
];

const TEXT_COLORS = [
  { id: "white",   label: "Белый" },
  { id: "black",   label: "Чёрный" },
  { id: "primary", label: "Акцентный" },
];

export default function StoriesTool() {
  const [topic, setTopic]       = useState("");
  const [mainText, setMainText] = useState("");
  const [subText, setSubText]   = useState("");
  const [selectedBg, setSelectedBg]         = useState("gradient_purple");
  const [textColor, setTextColor]           = useState("white");
  const [loading, setLoading]   = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!topic.trim())    { toast.error("Введите тему stories"); return; }
    if (!mainText.trim()) { toast.error("Введите главный текст"); return; }

    const allowed = await onGenerate();
    if (!allowed) return;

    const bgObj = BACKGROUNDS.find(b => b.id === selectedBg);
    const bgPrompt = bgObj?.prompt ?? "";

    setLoading(true);
    setResultUrl(null);
    try {
      const data = await generateApi.storiesGen(topic, mainText, subText, bgPrompt);
      setResultUrl(data.image_url);
      await toolsApi.saveGeneration("stories", topic, data.image_url, { main_text: mainText, sub_text: subText, bg: selectedBg, text_color: textColor });
      toast.success("Stories готово!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `stories-${topic.slice(0, 20).replace(/\s+/g, "-") || "result"}.png`;
      a.click();
    } catch {
      window.open(resultUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="stories" title="Генератор Stories" description="Готовый визуал для Instagram Stories" icon="Smartphone">
        {(onGenerate) => (
          <div className="space-y-5">

            {/* Настройки */}
            <div className="glass rounded-xl p-6 border border-white/5 space-y-5">

              {/* Тема */}
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Тема <span className="text-primary">*</span></label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: Запуск нового продукта"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              {/* Главный текст */}
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Главный текст <span className="text-primary">*</span></label>
                <textarea
                  value={mainText}
                  onChange={(e) => setMainText(e.target.value)}
                  placeholder="Крупный заголовок вашего Stories"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm resize-none outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              {/* Подтекст */}
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Подтекст <span className="text-white/30 text-xs">(необязательно)</span>
                </label>
                <Input
                  value={subText}
                  onChange={(e) => setSubText(e.target.value)}
                  placeholder="Дополнительная строка, призыв к действию..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              {/* Выбор фона */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Фон</label>
                <div className="grid grid-cols-3 gap-2">
                  {BACKGROUNDS.map((bg) => {
                    const isSelected = selectedBg === bg.id;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBg(bg.id)}
                        className={`px-3 py-2 text-xs rounded-lg border transition-all font-medium text-left ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {bg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Цвет текста */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Цвет текста</label>
                <div className="flex gap-2">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setTextColor(c.id)}
                      className={`px-4 py-2 text-xs rounded-lg border flex-1 transition-all font-medium ${
                        textColor === c.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Кнопка */}
              <Button
                onClick={() => generate(onGenerate)}
                disabled={loading}
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90"
              >
                {loading
                  ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Создаю Stories...</>
                  : <><Icon name="Sparkles" size={16} className="mr-2" />Создать Stories</>
                }
              </Button>
            </div>

            {/* Результат */}
            {(resultUrl || loading) && (
              <div className="glass rounded-xl border border-white/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="Smartphone" size={15} className="text-primary" />
                    <span className="text-sm font-medium text-white">Готовое Stories</span>
                    <span className="text-xs text-white/30">· 9:16</span>
                  </div>
                  {resultUrl && (
                    <button
                      onClick={downloadImage}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 rounded-lg text-xs text-white/50 hover:text-primary transition-all"
                    >
                      <Icon name="Download" size={13} />
                      Скачать
                    </button>
                  )}
                </div>

                <div className="p-5 flex justify-center">
                  {loading ? (
                    <div
                      className="bg-white/[0.03] rounded-xl flex flex-col items-center justify-center gap-3"
                      style={{ width: 280, height: 498 }}
                    >
                      <Icon name="Loader2" size={32} className="text-primary animate-spin" />
                      <p className="text-white/30 text-sm">Генерирую изображение...</p>
                    </div>
                  ) : resultUrl ? (
                    <img
                      src={resultUrl}
                      alt="Stories"
                      className="rounded-xl object-cover shadow-lg"
                      style={{ width: 280, height: 498 }}
                    />
                  ) : null}
                </div>
              </div>
            )}

          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
