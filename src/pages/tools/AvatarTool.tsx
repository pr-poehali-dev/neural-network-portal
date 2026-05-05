import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const AVATAR_STYLES = [
  { id: "business",   label: "Бизнес-портрет",   prompt: "professional business portrait, studio lighting, formal attire, clean background, LinkedIn style" },
  { id: "artist",     label: "Арт-портрет",       prompt: "artistic portrait, oil painting style, vibrant colors, impressionist brush strokes" },
  { id: "anime",      label: "Аниме",             prompt: "anime style portrait, manga illustration, Japanese animation aesthetic, vibrant" },
  { id: "pencil",     label: "Карандашный скетч", prompt: "pencil sketch portrait, hand drawn, detailed crosshatching, artistic black and white" },
  { id: "watercolor", label: "Акварель",           prompt: "watercolor portrait, soft washes, artistic painting, pastel colors" },
  { id: "3d",         label: "3D рендер",          prompt: "3D rendered portrait, Pixar style, high detail, soft rim lighting" },
  { id: "cyberpunk",  label: "Киберпанк",          prompt: "cyberpunk portrait, neon lights, futuristic, dark background, glowing accents" },
  { id: "fantasy",    label: "Фэнтези",            prompt: "fantasy portrait, magical atmosphere, ethereal lighting, mystical" },
  { id: "retro",      label: "Ретро/Поп-арт",     prompt: "retro pop art portrait, Andy Warhol style, bold colors, halftone pattern" },
  { id: "neon",       label: "Неон",               prompt: "neon portrait, dark background, colorful neon lights, futuristic glow" },
  { id: "minimalist", label: "Минимализм",         prompt: "minimalist portrait, flat design, simple lines, limited color palette" },
  { id: "vintage",    label: "Винтаж",             prompt: "vintage portrait, sepia tones, 1950s photography style, grain texture" },
];

export default function AvatarTool() {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userImageB64, setUserImageB64] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [results, setResults] = useState<Array<{ style: string; url: string }>>([]);
  const [loadingStyle, setLoadingStyle] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("Файл больше 10 МБ"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Загрузите изображение"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setUserImage(result);
      setUserImageB64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const toggleStyle = (id: string) => {
    setSelectedStyles(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedStyles.length === AVATAR_STYLES.length) {
      setSelectedStyles([]);
    } else {
      setSelectedStyles(AVATAR_STYLES.map(s => s.id));
    }
  };

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!userImageB64) { toast.error("Загрузите фото"); return; }
    if (selectedStyles.length === 0) { toast.error("Выберите хотя бы один стиль"); return; }

    const allowed = await onGenerate();
    if (!allowed) return;

    setResults([]);
    const initialLoading: Record<string, boolean> = {};
    selectedStyles.forEach(id => { initialLoading[id] = true; });
    setLoadingStyle(initialLoading);

    toast.info(`Генерирую ${selectedStyles.length} аватаров параллельно...`);

    try {
      const promises = selectedStyles.map(async (styleId) => {
        const styleObj = AVATAR_STYLES.find(s => s.id === styleId)!;
        try {
          const data = await generateApi.avatarGen(userImageB64, styleObj.prompt, styleId);
          setResults(prev => [...prev, { style: styleId, url: data.image_url }]);
          setLoadingStyle(prev => ({ ...prev, [styleId]: false }));
          return data;
        } catch (e) {
          setLoadingStyle(prev => ({ ...prev, [styleId]: false }));
          toast.error(`Ошибка стиля "${styleObj.label}"`);
          return null;
        }
      });

      await Promise.all(promises);
      await toolsApi.saveGeneration("avatar", `Аватар: ${selectedStyles.join(", ")}`, undefined, { styles: selectedStyles });
      toast.success("Аватары готовы!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoadingStyle({});
    }
  };

  const isAnyLoading = Object.values(loadingStyle).some(Boolean);
  const canGenerate = !!userImageB64 && selectedStyles.length > 0 && !isAnyLoading;

  const getStyleLabel = (id: string) => AVATAR_STYLES.find(s => s.id === id)?.label ?? id;

  const downloadImage = async (url: string, styleId: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `avatar-${styleId}.png`;
      a.click();
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="avatar" title="ИИ-аватар бренда" description="Генерирует аватары из вашего фото в разных стилях" icon="UserCircle">
        {(onGenerate) => (
          <div className="space-y-5">

            {/* Загрузка фото */}
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <label className="text-sm text-white/60 block">Ваше фото <span className="text-primary">*</span></label>

              {!userImage ? (
                <div
                  ref={dropRef}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <Icon name="ImageUp" size={32} className="text-white/20" />
                  <p className="text-white/40 text-sm">Перетащите фото или нажмите для выбора</p>
                  <p className="text-white/20 text-xs">JPG, PNG — до 10 МБ</p>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <img
                    src={userImage}
                    alt="preview"
                    className="w-[120px] h-[120px] rounded-xl object-cover border border-white/10 flex-shrink-0"
                  />
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-white/60">Фото загружено</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white hover:border-white/20 transition-all w-fit"
                    >
                      <Icon name="RefreshCw" size={12} />
                      Заменить
                    </button>
                    <button
                      onClick={() => { setUserImage(null); setUserImageB64(null); }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/30 hover:text-red-400 hover:border-red-400/20 transition-all w-fit"
                    >
                      <Icon name="Trash2" size={12} />
                      Удалить
                    </button>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
            </div>

            {/* Выбор стилей */}
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-white/60">Стили аватара <span className="text-primary">*</span></label>
                <button
                  onClick={toggleAll}
                  className="text-xs text-primary/70 hover:text-primary transition-colors"
                >
                  {selectedStyles.length === AVATAR_STYLES.length ? "Снять все" : "Выбрать все"}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {AVATAR_STYLES.map((style) => {
                  const isSelected = selectedStyles.includes(style.id);
                  return (
                    <button
                      key={style.id}
                      onClick={() => toggleStyle(style.id)}
                      className={`px-3 py-2.5 text-xs rounded-lg border transition-all text-left font-medium ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>

              {selectedStyles.length > 0 && (
                <p className="text-xs text-white/30">
                  Выбрано стилей: <span className="text-primary">{selectedStyles.length}</span>
                </p>
              )}
            </div>

            {/* Кнопка генерации */}
            <Button
              onClick={() => generate(onGenerate)}
              disabled={!canGenerate}
              className="w-full bg-primary text-black font-semibold hover:bg-primary/90"
            >
              {isAnyLoading
                ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую аватары...</>
                : <><Icon name="Sparkles" size={16} className="mr-2" />Создать аватары</>
              }
            </Button>

            {/* Результаты */}
            {(results.length > 0 || isAnyLoading) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Icon name="Images" size={15} className="text-primary" />
                  <span className="text-sm font-medium text-white">Результаты</span>
                  {isAnyLoading && (
                    <span className="text-xs text-white/30">
                      · {results.length} из {selectedStyles.length}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Готовые результаты */}
                  {results.map((r) => (
                    <div key={r.style} className="glass rounded-xl border border-white/5 overflow-hidden">
                      <img
                        src={r.url}
                        alt={getStyleLabel(r.style)}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="px-3 py-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-white/60 truncate">{getStyleLabel(r.style)}</span>
                        <button
                          onClick={() => downloadImage(r.url, r.style)}
                          className="flex-shrink-0 p-1.5 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 rounded-lg transition-all"
                          title="Скачать"
                        >
                          <Icon name="Download" size={12} className="text-white/50 hover:text-primary" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Карточки-плейсхолдеры для загружающихся стилей */}
                  {selectedStyles
                    .filter(id => loadingStyle[id] && !results.find(r => r.style === id))
                    .map(id => (
                      <div key={id} className="glass rounded-xl border border-white/5 overflow-hidden">
                        <div className="w-full aspect-square bg-white/[0.03] flex flex-col items-center justify-center gap-2">
                          <Icon name="Loader2" size={24} className="text-primary animate-spin" />
                          <span className="text-xs text-white/30">Генерирую...</span>
                        </div>
                        <div className="px-3 py-2">
                          <span className="text-xs text-white/40">{getStyleLabel(id)}</span>
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
