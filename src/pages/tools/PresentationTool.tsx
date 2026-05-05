import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const THEMES = [
  {
    id: "dark",
    label: "Тёмная",
    desc: "Элегантный тёмный фон",
    preview: "from-[#0f0f19] to-[#1a1a2e]",
    accent: "bg-indigo-500",
  },
  {
    id: "corporate",
    label: "Корпоратив",
    desc: "Деловой синий стиль",
    preview: "from-[#0a1432] to-[#0d2050]",
    accent: "bg-cyan-400",
  },
  {
    id: "creative",
    label: "Креатив",
    desc: "Яркий фиолетово-розовый",
    preview: "from-[#14082a] to-[#2d0a4e]",
    accent: "bg-pink-500",
  },
  {
    id: "light",
    label: "Светлая",
    desc: "Чистый минимализм",
    preview: "from-[#f0f4ff] to-[#e8ecf8]",
    accent: "bg-indigo-500",
  },
  {
    id: "minimal",
    label: "Минимализм",
    desc: "Чёрно-белый стиль",
    preview: "from-white to-gray-100",
    accent: "bg-gray-900",
  },
];

export default function PresentationTool() {
  const [topic, setTopic] = useState("");
  const [slidesCount, setSlidesCount] = useState(10);
  const [theme, setTheme] = useState("dark");
  const [loading, setLoading] = useState(false);
  const [pptxUrl, setPptxUrl] = useState<string | null>(null);
  const [resultSlides, setResultSlides] = useState<number | null>(null);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!topic.trim()) { toast.error("Введите тему презентации"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;

    setLoading(true);
    setPptxUrl(null);
    setResultSlides(null);
    try {
      const data = await generateApi.presentation(topic, slidesCount, theme);
      if (data.pptx_url) {
        setPptxUrl(data.pptx_url);
        setResultSlides(data.slides_count ?? slidesCount);
        await toolsApi.saveGeneration("presentation", topic, data.pptx_url, { slides_count: slidesCount, theme, result: data.result });
        toast.success("Презентация готова! Скачивай файл.");
      } else {
        toast.error("Не удалось создать файл, попробуй снова");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const selectedTheme = THEMES.find(t => t.id === theme)!;

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="presentation" title="Генерация презентаций" description="Готовый PPTX с картинками и дизайном" icon="Presentation">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-5">

              {/* Тема */}
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Тема презентации <span className="text-primary">*</span></label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: Стратегия продвижения в Instagram на 2025 год"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
              </div>

              {/* Слайды */}
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Слайдов: <span className="text-primary font-medium">{slidesCount}</span>
                </label>
                <input type="range" min={5} max={20} value={slidesCount}
                  onChange={(e) => setSlidesCount(Number(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-white/30 mt-1"><span>5</span><span>20</span></div>
              </div>

              {/* Стиль */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Стиль оформления</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {THEMES.map((t) => (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      className={`relative rounded-xl p-3 border transition-all text-left overflow-hidden ${
                        theme === t.id ? "border-primary" : "border-white/10 hover:border-white/20"
                      }`}>
                      {/* Превью фона */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${t.preview} opacity-80`} />
                      <div className="relative z-10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-2.5 h-2.5 rounded-full ${t.accent}`} />
                          <span className={`text-xs font-semibold ${t.id === "light" || t.id === "minimal" ? "text-gray-800" : "text-white"}`}>
                            {t.label}
                          </span>
                          {theme === t.id && <Icon name="Check" size={11} className="text-primary ml-auto" />}
                        </div>
                        <p className={`text-[10px] ${t.id === "light" || t.id === "minimal" ? "text-gray-500" : "text-white/50"}`}>
                          {t.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => generate(onGenerate)} disabled={loading}
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                {loading
                  ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Создаю презентацию (~2 мин)...</>
                  : <><Icon name="Presentation" size={16} className="mr-2" />Создать презентацию</>}
              </Button>

              {loading && (
                <div className="space-y-2">
                  {["Генерирую структуру слайдов...", "Создаю изображения для каждого слайда...", "Собираю PPTX-файл..."].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/40">
                      <Icon name="Loader2" size={11} className="animate-spin text-primary/60" />
                      {step}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Результат */}
            {pptxUrl && (
              <div className="glass rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${selectedTheme.preview}`} />
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                      <Icon name="FileText" size={26} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{topic}</h3>
                      <p className="text-white/50 text-sm mt-0.5">
                        {resultSlides} слайдов · {selectedTheme.label} · с картинками
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        Формат PowerPoint (.pptx) · открывается в Google Slides, Keynote, LibreOffice
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a href={pptxUrl} download={`презентация-${topic.slice(0, 30)}.pptx`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 transition-all text-sm">
                      <Icon name="Download" size={16} />
                      Скачать PPTX
                    </a>
                    <a href={pptxUrl} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-3 bg-white/10 text-white/60 hover:text-white rounded-xl transition-all border border-white/10 hover:border-white/20">
                      <Icon name="ExternalLink" size={16} />
                    </a>
                  </div>

                  <div className="flex items-start gap-2 bg-white/5 rounded-lg p-3">
                    <Icon name="Info" size={13} className="text-primary/60 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/40 leading-relaxed">
                      Чтобы открыть в Google Slides: зайди на <span className="text-white/60">slides.google.com</span> → Файл → Импортировать слайды → загрузи файл
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
