import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { toolsApi, generateApi, paymentsApi } from "@/lib/api";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const IMAGE_PACKS = [
  { slug: "img_pack_1",   label: "1 изображение",   price: 20,   images: 1 },
  { slug: "img_pack_10",  label: "10 изображений",  price: 200,  images: 10 },
  { slug: "img_pack_50",  label: "50 изображений",  price: 1000, images: 50 },
  { slug: "img_pack_100", label: "100 изображений", price: 2000, images: 100 },
];

const STYLE_PRESETS = [
  "Фотореализм", "Аниме", "Акварель", "Масло", "Пиксель арт", "3D рендер", "Минимализм", "Ретро",
];

const SIZE_OPTIONS = [
  { value: "square",    label: "1:1",   desc: "Квадрат",    icon: "□" },
  { value: "portrait",  label: "3:4",   desc: "Портрет",    icon: "▯" },
  { value: "landscape", label: "4:3",   desc: "Пейзаж",     icon: "▭" },
  { value: "story",     label: "9:16",  desc: "Сторис",     icon: "▯" },
  { value: "wide",      label: "16:9",  desc: "Широкий",    icon: "▭" },
];

export default function ImageGenTool() {
  const [tab, setTab] = useState<"generate" | "edit">("generate");

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [size, setSize] = useState("square");
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [editPrompt, setEditPrompt] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<string | null>(null);
  const [editSize, setEditSize] = useState("square");
  const [editLoading, setEditLoading] = useState(false);
  const [editResultUrl, setEditResultUrl] = useState<string | null>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [showPacks, setShowPacks] = useState(false);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const checkLimit = async (toolSlug: string) => {
    if (!user) { setAuthOpen(true); return false; }
    try {
      const limit = await toolsApi.checkLimit(toolSlug);
      if (!limit.allowed) {
        setShowPacks(true);
        return false;
      }
    } catch { /* ignore */ }
    return true;
  };

  const buyPack = async (slug: string) => {
    if (!user) { setAuthOpen(true); return; }
    setBuyingPack(slug);
    try {
      const res = await paymentsApi.create(slug);
      if (res.confirmation_url) {
        window.location.href = res.confirmation_url;
      } else if (res.demo) {
        toast.error("Оплата не настроена. Обратитесь к администратору.");
      }
    } catch {
      toast.error("Ошибка при создании платежа");
    } finally {
      setBuyingPack(null);
    }
  };

  const generate = async () => {
    if (!prompt.trim()) { toast.error("Введите описание изображения"); return; }
    if (!await checkLimit("image-gen")) return;

    setLoading(true);
    setResultUrl(null);
    try {
      const started = await generateApi.brathuaStart(prompt, style, size);
      const { operation_id, prompt: fullPrompt } = started;

      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        const poll = await generateApi.bratuhaPoll(operation_id, fullPrompt);
        if (poll.status === "completed" && poll.image_url) {
          setResultUrl(poll.image_url);
          await toolsApi.saveGeneration("image-gen", fullPrompt, poll.image_url);
          toast.success("Изображение создано!");
          return;
        }
        if (poll.status === "failed") {
          throw new Error(poll.error || "Ошибка генерации");
        }
      }
      throw new Error("Превышено время ожидания. Попробуйте ещё раз.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Файл больше 10 МБ"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setEditImage(result);
      // Сжимаем до 1024px перед отправкой
      const img = new Image();
      img.onload = () => {
        const MAX = 1024;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.85);
        setEditImageFile(compressed.split(",")[1]);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const editPhoto = async () => {
    if (!editImageFile) { toast.error("Загрузите фото"); return; }
    if (!editPrompt.trim()) { toast.error("Опишите что изменить"); return; }
    if (!await checkLimit("image-edit")) return;

    setEditLoading(true);
    setEditResultUrl(null);
    try {
      const started = await generateApi.brathuaEditStart(editImageFile, editPrompt, editSize);
      const { operation_id, prompt: fullPrompt } = started;

      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        const poll = await generateApi.bratuhaPoll(operation_id, fullPrompt);
        if (poll.status === "completed" && poll.image_url) {
          setEditResultUrl(poll.image_url);
          await toolsApi.saveGeneration("image-edit", fullPrompt, poll.image_url);
          toast.success("Фото отредактировано!");
          return;
        }
        if (poll.status === "failed") {
          throw new Error(poll.error || "Ошибка редактирования");
        }
      }
      throw new Error("Превышено время ожидания. Попробуйте ещё раз.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка редактирования");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="image-gen" title="Генерация изображений" description="По промту или смена стиля фото" icon="ImagePlus">
        {() => (
          <div className="space-y-5">
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
              <button
                onClick={() => setTab("generate")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "generate" ? "bg-primary text-black" : "text-white/50 hover:text-white"}`}
              >
                Генерация по промту
              </button>
              <button
                onClick={() => setTab("edit")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "edit" ? "bg-primary text-black" : "text-white/50 hover:text-white"}`}
              >
                Редактирование фото
              </button>
            </div>

            {tab === "generate" && (
              <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Описание изображения <span className="text-primary">*</span></label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Опишите что хотите увидеть. Например: девушка в кафе, утренний свет, тёплые тона, портрет"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:border-primary/50"
                  />
                  <p className="text-xs text-white/25 mt-1">
                    Нужны идеи? <Link to="/tools/roulette" className="text-primary hover:text-primary/80 underline">Фото-рулетка</Link>
                  </p>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Стиль (необязательно)</label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setStyle("")}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${style === "" ? "bg-primary text-black font-medium" : "bg-white/5 text-white/40 hover:text-white"}`}>
                      Авто
                    </button>
                    {STYLE_PRESETS.map((s) => (
                      <button key={s} onClick={() => setStyle(s)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all ${style === s ? "bg-white/20 text-white font-medium" : "bg-white/5 text-white/40 hover:text-white"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Размер</label>
                  <div className="grid grid-cols-5 gap-2">
                    {SIZE_OPTIONS.map((s) => (
                      <button key={s.value} onClick={() => setSize(s.value)}
                        className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-all gap-1 ${size === s.value ? "bg-primary text-black font-medium" : "bg-white/5 text-white/40 hover:text-white"}`}>
                        <span className="text-base leading-none">{s.icon}</span>
                        <span className="font-medium">{s.label}</span>
                        <span className="text-[10px] opacity-70">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {showPacks && (
                  <div className="space-y-3 border border-primary/20 rounded-xl p-4 bg-primary/5">
                    <p className="text-sm font-medium text-white">Выберите пакет изображений</p>
                    <div className="grid grid-cols-2 gap-2">
                      {IMAGE_PACKS.map((pack) => (
                        <button
                          key={pack.slug}
                          onClick={() => buyPack(pack.slug)}
                          disabled={buyingPack === pack.slug}
                          className="flex flex-col items-start p-3 rounded-lg bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/10 transition-all text-left"
                        >
                          <span className="text-sm font-semibold text-white">{pack.label}</span>
                          <span className="text-primary text-base font-bold mt-0.5">{pack.price} ₽</span>
                          {buyingPack === pack.slug && <span className="text-[10px] text-white/40 mt-1">Переход к оплате...</span>}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-white/30">Работает для генерации и редактирования фото</p>
                  </div>
                )}

                <Button onClick={generate} disabled={loading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                  {loading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую... (до 60 сек)</> : <><Icon name="ImagePlus" size={16} className="mr-2" />Создать изображение</>}
                </Button>

                {resultUrl && (
                  <div className="space-y-3">
                    <img src={resultUrl} alt="Результат" className="w-full rounded-xl border border-white/10" />
                    <Button
                      variant="outline"
                      className="w-full border-white/10 text-white hover:bg-white/5"
                      onClick={async () => {
                        try {
                          const res = await fetch(resultUrl);
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "neural-image.png";
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch {
                          window.open(resultUrl, "_blank");
                        }
                      }}
                    >
                      <Icon name="Download" size={16} className="mr-2" />
                      Скачать изображение
                    </Button>
                  </div>
                )}
              </div>
            )}

            {tab === "edit" && (
              <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Загрузите фото <span className="text-primary">*</span></label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {editImage ? (
                    <div className="relative">
                      <img src={editImage} alt="Загруженное фото" className="w-full rounded-xl border border-white/10 max-h-64 object-cover" />
                      <button
                        onClick={() => { setEditImage(null); setEditImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-all"
                      >
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/10 hover:border-primary/40 rounded-xl p-8 text-center transition-all group"
                    >
                      <Icon name="Upload" size={32} className="text-white/20 group-hover:text-primary/50 mx-auto mb-2 transition-all" />
                      <p className="text-sm text-white/40 group-hover:text-white/60">Нажмите чтобы выбрать фото</p>
                      <p className="text-xs text-white/20 mt-1">JPG, PNG до 5 МБ</p>
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Что изменить? <span className="text-primary">*</span></label>
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Например: сделай закат оранжевым, добавь снег, измени фон на лесной пейзаж"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Размер результата</label>
                  <div className="grid grid-cols-5 gap-2">
                    {SIZE_OPTIONS.map((s) => (
                      <button key={s.value} onClick={() => setEditSize(s.value)}
                        className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-all gap-1 ${editSize === s.value ? "bg-primary text-black font-medium" : "bg-white/5 text-white/40 hover:text-white"}`}>
                        <span className="text-base leading-none">{s.icon}</span>
                        <span className="font-medium">{s.label}</span>
                        <span className="text-[10px] opacity-70">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {showPacks && (
                  <div className="space-y-3 border border-primary/20 rounded-xl p-4 bg-primary/5">
                    <p className="text-sm font-medium text-white">Выберите пакет изображений</p>
                    <div className="grid grid-cols-2 gap-2">
                      {IMAGE_PACKS.map((pack) => (
                        <button
                          key={pack.slug}
                          onClick={() => buyPack(pack.slug)}
                          disabled={buyingPack === pack.slug}
                          className="flex flex-col items-start p-3 rounded-lg bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/10 transition-all text-left"
                        >
                          <span className="text-sm font-semibold text-white">{pack.label}</span>
                          <span className="text-primary text-base font-bold mt-0.5">{pack.price} ₽</span>
                          {buyingPack === pack.slug && <span className="text-[10px] text-white/40 mt-1">Переход к оплате...</span>}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-white/30">Работает для генерации и редактирования фото</p>
                  </div>
                )}

                <Button onClick={editPhoto} disabled={editLoading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                  {editLoading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Редактирую... (до 60 сек)</> : <><Icon name="Wand2" size={16} className="mr-2" />Применить изменения</>}
                </Button>

                {editResultUrl && (
                  <div className="space-y-3">
                    <p className="text-xs text-white/40">Результат:</p>
                    <img src={editResultUrl} alt="Результат" className="w-full rounded-xl border border-white/10" />
                    <Button
                      variant="outline"
                      className="w-full border-white/10 text-white hover:bg-white/5"
                      onClick={async () => {
                        try {
                          const res = await fetch(editResultUrl);
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "edited-image.png";
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch {
                          window.open(editResultUrl, "_blank");
                        }
                      }}
                    >
                      <Icon name="Download" size={16} className="mr-2" />
                      Скачать изображение
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="glass rounded-xl p-5 border border-white/5">
              <p className="text-white/30 mb-3 text-xs uppercase tracking-wider">Советы</p>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <Icon name="Zap" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/50">Генерация занимает до 60 секунд — модель работает на мощных серверах</p>
                </div>
                <div className="flex gap-3 items-start">
                  <Icon name="Palette" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/50">Добавь "фотореалистично", "8K", "профессиональный" для лучшего качества</p>
                </div>
                <div className="flex gap-3 items-start">
                  <Icon name="ImageOff" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/50">Для редактирования лучше всего подходят чёткие фото с хорошим освещением</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </ToolWrapper>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}