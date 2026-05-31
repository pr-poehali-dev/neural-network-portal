import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import ImageGenPacksPanel from "./ImageGenPacksPanel";

const SIZE_OPTIONS = [
  { value: "square",    label: "1:1",  desc: "Квадрат", icon: "□" },
  { value: "portrait",  label: "3:4",  desc: "Портрет", icon: "▯" },
  { value: "landscape", label: "4:3",  desc: "Пейзаж",  icon: "▭" },
  { value: "story",     label: "9:16", desc: "Сторис",  icon: "▯" },
  { value: "wide",      label: "16:9", desc: "Широкий", icon: "▭" },
];

interface Props {
  editPrompt: string;
  editImage: string | null;
  editSize: string;
  editLoading: boolean;
  editResultUrl: string | null;
  showPacks: boolean;
  buyingPack: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
  onPromptChange: (v: string) => void;
  onSizeChange: (v: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onEdit: () => void;
  onBuyPack: (slug: string) => void;
}

export default function ImageGenTabEdit({
  editPrompt, editImage, editSize, editLoading, editResultUrl,
  showPacks, buyingPack,
  fileInputRef,
  onPromptChange, onSizeChange, onFileSelect, onClearImage,
  onEdit, onBuyPack,
}: Props) {
  return (
    <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
      <div>
        <label className="text-sm text-white/60 mb-1.5 block">Загрузите фото <span className="text-primary">*</span></label>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={onFileSelect}
          className="hidden"
        />
        {editImage ? (
          <div className="relative">
            <img src={editImage} alt="Загруженное фото" className="w-full rounded-xl border border-white/10 max-h-64 object-cover" />
            <button
              onClick={onClearImage}
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
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Например: сделай закат оранжевым, добавь снег, измени фон на лесной пейзаж"
          className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:border-primary/50"
        />
      </div>

      <div>
        <label className="text-sm text-white/60 mb-1.5 block">Размер результата</label>
        <div className="grid grid-cols-5 gap-2">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => onSizeChange(s.value)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-all gap-1 ${editSize === s.value ? "bg-primary text-black font-medium" : "bg-white/5 text-white/40 hover:text-white"}`}
            >
              <span className="text-base leading-none">{s.icon}</span>
              <span className="font-medium">{s.label}</span>
              <span className="text-[10px] opacity-70">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {showPacks && <ImageGenPacksPanel buyingPack={buyingPack} onBuy={onBuyPack} />}

      <Button onClick={onEdit} disabled={editLoading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
        {editLoading
          ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Редактирую... (до 60 сек)</>
          : <><Icon name="Wand2" size={16} className="mr-2" />Применить изменения</>
        }
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
  );
}
