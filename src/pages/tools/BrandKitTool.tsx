import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const BRAND_KIT_KEY = "brand_kit";

const TONES = [
  { id: "экспертный",      label: "Экспертный" },
  { id: "дружелюбный",     label: "Дружелюбный" },
  { id: "вдохновляющий",   label: "Вдохновляющий" },
  { id: "продающий",       label: "Продающий" },
  { id: "юмористический",  label: "Юмористический" },
];

interface BrandKitData {
  brandName: string;
  niche: string;
  targetAudience: string;
  usp: string;
  tone: string;
  keywords: string;
  mainColors: string;
}

const EMPTY: BrandKitData = {
  brandName: "",
  niche: "",
  targetAudience: "",
  usp: "",
  tone: "экспертный",
  keywords: "",
  mainColors: "",
};

export default function BrandKitTool() {
  const [brandName, setBrandName]           = useState("");
  const [niche, setNiche]                   = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [usp, setUsp]                       = useState("");
  const [tone, setTone]                     = useState("экспертный");
  const [keywords, setKeywords]             = useState("");
  const [mainColors, setMainColors]         = useState("");
  const [saved, setSaved]                   = useState(false);
  const [generating, setGenerating]         = useState(false);
  const [aiSuggestions, setAiSuggestions]   = useState("");

  // Загрузка из localStorage при монтировании
  useEffect(() => {
    loadBrandKit();
  }, []);

  const loadBrandKit = () => {
    try {
      const raw = localStorage.getItem(BRAND_KIT_KEY);
      if (!raw) return;
      const data: BrandKitData = JSON.parse(raw);
      setBrandName(data.brandName ?? "");
      setNiche(data.niche ?? "");
      setTargetAudience(data.targetAudience ?? "");
      setUsp(data.usp ?? "");
      setTone(data.tone ?? "экспертный");
      setKeywords(data.keywords ?? "");
      setMainColors(data.mainColors ?? "");
      setSaved(true);
    } catch {
      // localStorage недоступен или данные повреждены
    }
  };

  const saveBrandKit = () => {
    const data: BrandKitData = { brandName, niche, targetAudience, usp, tone, keywords, mainColors };
    try {
      localStorage.setItem(BRAND_KIT_KEY, JSON.stringify(data));
      setSaved(true);
      toast.success("Бренд-кит сохранён!");
    } catch {
      toast.error("Не удалось сохранить. Проверьте настройки браузера.");
    }
  };

  const clearBrandKit = () => {
    localStorage.removeItem(BRAND_KIT_KEY);
    const e = EMPTY;
    setBrandName(e.brandName);
    setNiche(e.niche);
    setTargetAudience(e.targetAudience);
    setUsp(e.usp);
    setTone(e.tone);
    setKeywords(e.keywords);
    setMainColors(e.mainColors);
    setAiSuggestions("");
    setSaved(false);
    toast.info("Бренд-кит очищен");
  };

  const generateAnalysis = async (onGenerate: () => Promise<boolean>) => {
    if (!brandName.trim()) { toast.error("Введите название бренда"); return; }
    if (!niche.trim())     { toast.error("Введите нишу бренда"); return; }

    const allowed = await onGenerate();
    if (!allowed) return;

    setGenerating(true);
    setAiSuggestions("");
    try {
      const data = await generateApi.brandKitAnalysis({
        brandName, niche, targetAudience, usp, tone, keywords, mainColors,
      });
      setAiSuggestions(data.result);
      await toolsApi.saveGeneration("brand-kit", brandName, undefined, { niche, tone, result: data.result });
      toast.success("Анализ готов!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="brand-kit" title="Бренд-кит" description="Настрой бренд один раз — все инструменты будут знать твой стиль" icon="Shield">
        {(onGenerate) => (
          <div className="space-y-5">

            {/* Баннер «активен» */}
            {saved && (
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-green-500/20 bg-green-500/10">
                <Icon name="CheckCircle" size={16} className="text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-400">Бренд-кит активен!</p>
                  <p className="text-xs text-green-400/60 mt-0.5">Все инструменты знают ваш стиль и используют его при генерации.</p>
                </div>
                <button
                  onClick={clearBrandKit}
                  className="flex-shrink-0 text-xs text-white/20 hover:text-white/50 transition-colors"
                  title="Сбросить бренд-кит"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            )}

            {/* Шапка-подсказка */}
            <div className="flex items-start gap-3 px-5 py-4 rounded-xl border border-white/5 bg-white/[0.02]">
              <Icon name="Shield" size={18} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/50 leading-relaxed">
                Заполни один раз — все инструменты будут знать твой стиль, тон и аудиторию и генерировать контент точнее.
              </p>
            </div>

            {/* Секция 1: О бренде */}
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Building2" size={15} className="text-primary" />
                <span className="text-sm font-medium text-white">О бренде</span>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Название бренда / аккаунта <span className="text-primary">*</span>
                </label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Например: @maria_coaching или «Студия Bloom»"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Ниша (чем занимаешься) <span className="text-primary">*</span>
                </label>
                <Input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Например: бизнес-коучинг, дизайн интерьеров, онлайн-фитнес"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Целевая аудитория (кто твой клиент)</label>
                <textarea
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Например: женщины 25–40 лет, предприниматели, хотят масштабировать бизнес"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm resize-none outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">УТП — чем ты отличаешься от конкурентов</label>
                <textarea
                  value={usp}
                  onChange={(e) => setUsp(e.target.value)}
                  placeholder="Например: работаю только с малым бизнесом, авторская методика за 30 дней, гарантия результата"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm resize-none outline-none focus:border-primary/40 transition-colors"
                />
              </div>
            </div>

            {/* Секция 2: Стиль */}
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Palette" size={15} className="text-primary" />
                <span className="text-sm font-medium text-white">Стиль</span>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">Тон голоса бренда</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`px-4 py-2 text-xs rounded-lg border transition-all font-medium ${
                        tone === t.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Ключевые слова бренда (через запятую)</label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Например: рост, результат, системность, трансформация"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
                <p className="text-xs text-white/20 mt-1">Слова, которые должны звучать в твоём контенте</p>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Фирменные цвета (HEX или названия)</label>
                <Input
                  value={mainColors}
                  onChange={(e) => setMainColors(e.target.value)}
                  placeholder="Например: #6366f1, #ec4899 или фиолетовый, розовый"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="grid sm:grid-cols-2 gap-3">
              <Button
                onClick={saveBrandKit}
                variant="outline"
                className="w-full border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:border-green-500/50 font-semibold"
              >
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить бренд-кит
              </Button>

              <Button
                onClick={() => generateAnalysis(onGenerate)}
                disabled={generating}
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90"
              >
                {generating
                  ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Анализирую...</>
                  : <><Icon name="Sparkles" size={16} className="mr-2" />Получить ИИ-анализ бренда</>
                }
              </Button>
            </div>

            {/* Блок с ИИ-анализом */}
            {aiSuggestions && (
              <div className="glass rounded-xl border border-primary/20 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                  <Icon name="Sparkles" size={15} className="text-primary" />
                  <span className="text-sm font-medium text-white">ИИ-анализ вашего бренда</span>
                </div>
                <div className="px-5 py-5">
                  <pre className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed font-sans">
                    {aiSuggestions}
                  </pre>
                </div>
              </div>
            )}

          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
