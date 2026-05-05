import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { toolsApi, generateApi } from "@/lib/api";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const STYLE_PRESETS = [
  "Фотореализм", "Аниме", "Акварель", "Масло", "Пиксель арт", "3D рендер", "Минимализм", "Ретро",
];

export default function ImageGenTool() {
  const [tab, setTab] = useState<"generate" | "edit">("generate");

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [editPrompt, setEditPrompt] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editResultUrl, setEditResultUrl] = useState<string | null>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const checkLimit = async () => {
    if (!user) { setAuthOpen(true); return false; }
    try {
      const limit = await toolsApi.checkLimit("image-gen");
      if (!limit.allowed) {
        toast.error(
          <div>
            <p className="font-medium">Лимит исчерпан</p>
            <Link to="/pricing" className="text-primary text-sm underline">Выбрать тариф →</Link>
          </div>
        );
        return false;
      }
    } catch { /* ignore */ }
    return true;
  };

  const generate = async () => {
    if (!prompt.trim()) { toast.error("Введите описание изображения"); return; }
    if (!await checkLimit()) return;

    setLoading(true);
    setResultUrl(null);
    try {
      const fullPrompt = style ? `${prompt}, style: ${style}` : prompt;
      const res = await generateApi.imageGen(fullPrompt, style);
      setResultUrl(res.image_url);
      await toolsApi.saveGeneration("image-gen", fullPrompt, res.image_url);
      toast.success("Изображение создано!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Файл больше 5 МБ"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setEditImage(result);
      const base64 = result.split(",")[1];
      setEditImageFile(base64);
    };
    reader.readAsDataURL(file);
  };

  const editPhoto = async () => {
    if (!editImageFile) { toast.error("Загрузите фото"); return; }
    if (!editPrompt.trim()) { toast.error("Опишите что изменить"); return; }
    if (!await checkLimit()) return;

    setEditLoading(true);
    setEditResultUrl(null);
    try {
      const res = await generateApi.imageEdit(editImageFile, editPrompt);
      setEditResultUrl(res.image_url);
      await toolsApi.saveGeneration("image-edit", editPrompt, res.image_url);
      toast.success("Фото отредактировано!");
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

                <div className="flex items-center gap-2 text-xs text-white/30 bg-primary/5 border border-primary/10 rounded-lg p-3">
                  <Icon name="Gift" size={14} className="text-primary" />
                  <span>Первая генерация — бесплатно!</span>
                </div>

                <Button onClick={generate} disabled={loading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                  {loading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую... (до 60 сек)</> : <><Icon name="ImagePlus" size={16} className="mr-2" />Создать изображение</>}
                </Button>

                {resultUrl && (
                  <div className="space-y-3">
                    <img src={resultUrl} alt="Результат" className="w-full rounded-xl border border-white/10" />
                    <a
                      href={resultUrl}
                      download="generated.png"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
                        <Icon name="Download" size={16} className="mr-2" />
                        Скачать изображение
                      </Button>
                    </a>
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

                <Button onClick={editPhoto} disabled={editLoading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                  {editLoading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Редактирую... (до 60 сек)</> : <><Icon name="Wand2" size={16} className="mr-2" />Применить изменения</>}
                </Button>

                {editResultUrl && (
                  <div className="space-y-3">
                    <p className="text-xs text-white/40">Результат:</p>
                    <img src={editResultUrl} alt="Результат" className="w-full rounded-xl border border-white/10" />
                    <a
                      href={editResultUrl}
                      download="edited.png"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
                        <Icon name="Download" size={16} className="mr-2" />
                        Скачать изображение
                      </Button>
                    </a>
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
