import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Link } from "react-router-dom";
import ImageGenPacksPanel from "./ImageGenPacksPanel";

const STYLE_PRESETS = [
  "Фотореализм", "Аниме", "Акварель", "Масло", "Пиксель арт", "3D рендер", "Минимализм", "Ретро",
];

const SIZE_OPTIONS = [
  { value: "square",    label: "1:1",  desc: "Квадрат", icon: "□" },
  { value: "portrait",  label: "3:4",  desc: "Портрет", icon: "▯" },
  { value: "landscape", label: "4:3",  desc: "Пейзаж",  icon: "▭" },
  { value: "story",     label: "9:16", desc: "Сторис",  icon: "▯" },
  { value: "wide",      label: "16:9", desc: "Широкий", icon: "▭" },
];

interface Props {
  prompt: string;
  style: string;
  size: string;
  loading: boolean;
  resultUrl: string | null;
  showPacks: boolean;
  buyingPack: string | null;
  onPromptChange: (v: string) => void;
  onStyleChange: (v: string) => void;
  onSizeChange: (v: string) => void;
  onGenerate: () => void;
  onBuyPack: (slug: string) => void;
}

export default function ImageGenTabGenerate({
  prompt, style, size, loading, resultUrl,
  showPacks, buyingPack,
  onPromptChange, onStyleChange, onSizeChange,
  onGenerate, onBuyPack,
}: Props) {
  return (
    <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
      <div>
        <label className="text-sm text-white/60 mb-1.5 block">Описание изображения <span className="text-primary">*</span></label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
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
          <button
            onClick={() => onStyleChange("")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${style === "" ? "bg-primary text-black font-medium" : "bg-white/5 text-white/40 hover:text-white"}`}
          >
            Авто
          </button>
          {STYLE_PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => onStyleChange(s)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${style === s ? "bg-white/20 text-white font-medium" : "bg-white/5 text-white/40 hover:text-white"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-white/60 mb-1.5 block">Размер</label>
        <div className="grid grid-cols-5 gap-2">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => onSizeChange(s.value)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-all gap-1 ${size === s.value ? "bg-primary text-black font-medium" : "bg-white/5 text-white/40 hover:text-white"}`}
            >
              <span className="text-base leading-none">{s.icon}</span>
              <span className="font-medium">{s.label}</span>
              <span className="text-[10px] opacity-70">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {showPacks && <ImageGenPacksPanel buyingPack={buyingPack} onBuy={onBuyPack} />}

      <Button onClick={onGenerate} disabled={loading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
        {loading
          ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую... (до 60 сек)</>
          : <><Icon name="ImagePlus" size={16} className="mr-2" />Создать изображение</>
        }
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
  );
}
