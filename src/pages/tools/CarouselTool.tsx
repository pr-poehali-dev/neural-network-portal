import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import type { CarouselSlide } from "@/lib/api";
import { toast } from "sonner";

const IMAGE_STYLES = [
  { id: "minimalist",        label: "Минимализм",          prompt: "minimalist design, clean white background, simple shapes, modern typography" },
  { id: "gradient",          label: "Градиент",            prompt: "vibrant gradient background, purple pink orange, modern UI design" },
  { id: "dark",              label: "Тёмный",              prompt: "dark background, neon accents, premium dark theme, elegant" },
  { id: "watercolor",        label: "Акварель",            prompt: "soft watercolor background, pastel colors, artistic brush strokes" },
  { id: "3d",                label: "3D",                  prompt: "3D render, glossy objects, soft shadows, depth of field, Blender style" },
  { id: "flat",              label: "Флэт",                prompt: "flat design, bold colors, geometric shapes, vector illustration" },
  { id: "neon",              label: "Неон",                prompt: "neon glow effects, dark background, cyberpunk aesthetic, vivid colors" },
  { id: "paper",             label: "Бумага",              prompt: "paper texture background, origami style, natural colors, handcraft" },
  { id: "nature",            label: "Природа",             prompt: "natural background, green plants, sunlight through leaves, organic" },
  { id: "office",            label: "Офис / Бизнес",       prompt: "professional office background, business aesthetic, clean corporate" },
  { id: "social",            label: "Соцсети",             prompt: "social media aesthetic, trendy colors, Instagram style, bright and clean" },
  { id: "retro",             label: "Ретро",               prompt: "retro vintage style, grain texture, muted colors, 80s aesthetic" },
  { id: "luxury",            label: "Люкс",                prompt: "luxury gold and black, premium feel, sophisticated, elegant design" },
  { id: "tech",              label: "Технологии",          prompt: "tech background, circuit boards, blue glow, digital futuristic" },
  { id: "food",              label: "Еда / Кулинария",     prompt: "food photography style, warm tones, kitchen background, cozy" },
  { id: "fashion",           label: "Мода",                prompt: "fashion editorial style, high contrast, stylish aesthetic, runway" },
  { id: "sport",             label: "Спорт",               prompt: "sports dynamic background, energy, motion blur, bold colors" },
  { id: "medical",           label: "Медицина",            prompt: "clean medical background, blue and white, professional healthcare" },
  { id: "education",         label: "Образование",         prompt: "education background, books and pencils, warm academic atmosphere" },
  { id: "travel",            label: "Путешествия",         prompt: "travel photography, beautiful landscape, adventure, golden hour" },
  { id: "finance",           label: "Финансы",             prompt: "financial background, graphs and charts, professional, green and blue" },
  { id: "beauty",            label: "Красота",             prompt: "beauty and cosmetics, pink pastel, makeup, feminine soft aesthetic" },
  { id: "real_estate",       label: "Недвижимость",        prompt: "modern interior design, luxury apartment, clean architecture" },
  { id: "fitness",           label: "Фитнес",              prompt: "fitness gym background, motivational, strong colors, active lifestyle" },
  { id: "art",               label: "Арт",                 prompt: "abstract art background, colorful brushstrokes, creative expressive" },
  { id: "space",             label: "Космос",              prompt: "space galaxy background, stars and nebula, deep universe, purple blue" },
  { id: "anime",             label: "Аниме",               prompt: "anime illustration style, vibrant colors, manga aesthetic, Japan" },
  { id: "kids",              label: "Детский",             prompt: "kids friendly background, cartoon style, bright rainbow colors, playful" },
  { id: "eco",               label: "Эко / Зелёный",       prompt: "eco friendly green background, sustainability, natural organic" },
  { id: "christmas",         label: "Праздник",            prompt: "festive holiday background, warm lights, celebration, golden red" },
  { id: "dark_luxury",       label: "Тёмный люкс",         prompt: "dark luxury background, velvet texture, gold accents, rich premium" },
  { id: "pastel",            label: "Пастель",             prompt: "soft pastel colors, dreamy aesthetic, gentle pink blue purple tones" },
  { id: "geometric",         label: "Геометрия",           prompt: "geometric pattern background, bold shapes, modern graphic design" },
  { id: "sketch",            label: "Скетч",               prompt: "hand drawn sketch style, pencil lines, whiteboard drawing, doodle art" },
  { id: "bokeh",             label: "Боке",                prompt: "bokeh background, blurred lights, shallow depth of field, photography" },
];

export default function CarouselTool() {
  const [topic, setTopic] = useState("");
  const [slidesCount, setSlidesCount] = useState(7);
  const [aiText, setAiText] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState("minimalist");
  const [userImageB64, setUserImageB64] = useState<string | null>(null);
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null);

  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});
  const [activeSlide, setActiveSlide] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Файл больше 5 МБ"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setUserImagePreview(result);
      setUserImageB64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const generateStructure = async (onGenerate: () => Promise<boolean>) => {
    if (!topic.trim()) { toast.error("Введите тему карусели"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;

    setLoadingStructure(true);
    setSlides([]);
    setActiveSlide(0);
    try {
      const data = await generateApi.carouselStructure(topic, slidesCount, aiText);
      setSlides(data.slides.map(s => ({ ...s, image_url: undefined })));
      await toolsApi.saveGeneration("carousel", topic, undefined, { slides_count: slidesCount, result: JSON.stringify(data.slides) });
      toast.success("Структура готова! Теперь генерируй изображения.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoadingStructure(false);
    }
  };

  const generateImageForSlide = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide) return;
    const styleObj = IMAGE_STYLES.find(s => s.id === selectedStyle);
    const stylePrompt = styleObj?.prompt ?? "minimalist clean design";

    setLoadingImages(prev => ({ ...prev, [slideIndex]: true }));
    try {
      const data = await generateApi.carouselImage(
        slide.visual_prompt,
        stylePrompt,
        slideIndex,
        userImageB64 ?? undefined
      );
      setSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, image_url: data.image_url } : s));
      toast.success(`Слайд ${slideIndex + 1} готов!`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : `Ошибка слайда ${slideIndex + 1}`);
    } finally {
      setLoadingImages(prev => ({ ...prev, [slideIndex]: false }));
    }
  };

  const generateAllImages = async () => {
    toast.info("Генерирую все изображения последовательно...");
    for (let i = 0; i < slides.length; i++) {
      await generateImageForSlide(i);
    }
    toast.success("Все изображения готовы!");
  };

  const currentSlide = slides[activeSlide];
  const styleObj = IMAGE_STYLES.find(s => s.id === selectedStyle);

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="carousel" title="Пост-карусель" description="Готовые слайды с изображениями для Instagram" icon="LayoutTemplate">
        {(onGenerate) => (
          <div className="space-y-5">

            {/* Настройки */}
            <div className="glass rounded-xl p-6 border border-white/5 space-y-5">

              {/* Тема */}
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Тема карусели <span className="text-primary">*</span></label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: 7 ошибок начинающих предпринимателей"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
              </div>

              {/* Слайды + текст */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">
                    Слайдов: <span className="text-primary font-medium">{slidesCount}</span>
                  </label>
                  <input type="range" min={4} max={15} value={slidesCount}
                    onChange={(e) => setSlidesCount(Number(e.target.value))}
                    className="w-full accent-primary" />
                  <div className="flex justify-between text-xs text-white/30 mt-1"><span>4</span><span>15</span></div>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Текст на слайдах</label>
                  <div className="flex gap-2">
                    <button onClick={() => setAiText(true)}
                      className={`flex-1 py-2 text-xs rounded-lg transition-all border ${aiText ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}>
                      ИИ придумает текст
                    </button>
                    <button onClick={() => setAiText(false)}
                      className={`flex-1 py-2 text-xs rounded-lg transition-all border ${!aiText ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}>
                      Я напишу сам
                    </button>
                  </div>
                </div>
              </div>

              {/* Стиль изображений */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Стиль изображений</label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {IMAGE_STYLES.map((style) => (
                    <button key={style.id} onClick={() => setSelectedStyle(style.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg transition-all border whitespace-nowrap ${
                        selectedStyle === style.id
                          ? "bg-primary/20 border-primary text-primary font-medium"
                          : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                      }`}>
                      {style.label}
                    </button>
                  ))}
                </div>
                {styleObj && (
                  <p className="text-xs text-white/25 mt-1.5">Выбран: <span className="text-white/40">{styleObj.label}</span></p>
                )}
              </div>

              {/* Своё фото */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Своё фото / предмет (необязательно)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/50 hover:text-white hover:border-white/20 transition-all">
                    <Icon name="Upload" size={14} />
                    {userImagePreview ? "Изменить фото" : "Загрузить фото"}
                  </button>
                  {userImagePreview && (
                    <>
                      <img src={userImagePreview} className="w-10 h-10 rounded-lg object-cover border border-white/10" alt="preview" />
                      <button onClick={() => { setUserImageB64(null); setUserImagePreview(null); }}
                        className="text-xs text-white/30 hover:text-white/60 transition-colors">
                        <Icon name="X" size={14} />
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-white/20 mt-1">Фото будет встроено в стиль каждого слайда через ИИ</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </div>

              <Button onClick={() => generateStructure(onGenerate)} disabled={loadingStructure}
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                {loadingStructure
                  ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Gemini создаёт структуру...</>
                  : <><Icon name="Sparkles" size={16} className="mr-2" />Создать карусель</>}
              </Button>
            </div>

            {/* Результат — слайды */}
            {slides.length > 0 && (
              <div className="space-y-4">
                {/* Шапка с кнопкой генерировать все */}
                <div className="glass rounded-xl border border-white/5 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="LayoutGrid" size={16} className="text-primary" />
                    <span className="text-sm font-medium text-white">{slides.length} слайдов</span>
                    <span className="text-xs text-white/30">· стиль: {styleObj?.label}</span>
                  </div>
                  <Button onClick={generateAllImages} size="sm"
                    disabled={Object.values(loadingImages).some(Boolean)}
                    className="bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 gap-2 text-xs">
                    <Icon name="Wand2" size={13} />
                    Генерировать все фото
                  </Button>
                </div>

                {/* Превью карусели */}
                <div className="glass rounded-xl border border-white/5 overflow-hidden">
                  {/* Большой слайд */}
                  <div className="relative bg-black/40 aspect-square max-h-[420px] flex items-center justify-center overflow-hidden">
                    {currentSlide?.image_url ? (
                      <img src={currentSlide.image_url} alt={currentSlide.title}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-white/[0.02]">
                        <Icon name="ImagePlus" size={32} className="text-white/20" />
                        <p className="text-white/30 text-sm">Нет изображения</p>
                      </div>
                    )}

                    {/* Текст поверх */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                      <p className="text-white font-bold text-lg leading-tight">{currentSlide?.title}</p>
                      {currentSlide?.text && (
                        <p className="text-white/70 text-sm mt-1 leading-relaxed line-clamp-3">{currentSlide.text}</p>
                      )}
                    </div>

                    {/* Номер слайда */}
                    <div className="absolute top-3 right-3 bg-black/50 text-white/60 text-xs px-2 py-1 rounded-lg">
                      {activeSlide + 1} / {slides.length}
                    </div>

                    {/* Кнопка генерировать изображение */}
                    <button
                      onClick={() => generateImageForSlide(activeSlide)}
                      disabled={loadingImages[activeSlide]}
                      className="absolute top-3 left-3 bg-primary/80 hover:bg-primary text-black text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                    >
                      {loadingImages[activeSlide]
                        ? <><Icon name="Loader2" size={12} className="animate-spin" />Генерирую...</>
                        : <><Icon name="ImagePlus" size={12} />Сгенерировать фото</>}
                    </button>
                  </div>

                  {/* Миниатюры */}
                  <div className="flex gap-2 p-3 overflow-x-auto border-t border-white/5">
                    {slides.map((slide, i) => (
                      <button key={i} onClick={() => setActiveSlide(i)}
                        className={`flex-shrink-0 relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          activeSlide === i ? "border-primary" : "border-white/10 hover:border-white/30"
                        }`}>
                        {slide.image_url ? (
                          <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            {loadingImages[i]
                              ? <Icon name="Loader2" size={14} className="text-primary animate-spin" />
                              : <span className="text-white/30 text-xs font-medium">{i + 1}</span>}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Список слайдов */}
                <div className="space-y-2">
                  {slides.map((slide, i) => (
                    <div key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`glass rounded-xl border p-4 cursor-pointer transition-all ${
                        activeSlide === i ? "border-primary/40 bg-primary/5" : "border-white/5 hover:border-white/10"
                      }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          activeSlide === i ? "bg-primary text-black" : "bg-white/10 text-white/60"
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{slide.title}</p>
                          <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{slide.text}</p>
                          <p className="text-xs text-white/20 mt-1 italic">Визуал: {slide.visual_prompt}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {slide.image_url && <Icon name="CheckCircle" size={14} className="text-green-400" />}
                          <button
                            onClick={(e) => { e.stopPropagation(); generateImageForSlide(i); }}
                            disabled={loadingImages[i]}
                            className="text-xs text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
                          >
                            {loadingImages[i]
                              ? <Icon name="Loader2" size={12} className="animate-spin" />
                              : <Icon name="RefreshCw" size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>
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
