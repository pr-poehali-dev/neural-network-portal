import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { toolsApi } from "@/lib/api";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const STYLE_PRESETS = [
  "Фотореализм", "Аниме", "Акварель", "Масло", "Пиксель арт", "3D рендер", "Минимализм", "Ретро",
];

export default function ImageGenTool() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();

  const generate = async () => {
    if (!prompt.trim()) { toast.error("Введите описание изображения"); return; }

    if (!user) { setAuthOpen(true); return; }

    try {
      const limit = await toolsApi.checkLimit("image-gen");
      if (!limit.allowed) {
        toast.error(
          <div>
            <p className="font-medium">Лимит исчерпан</p>
            <Link to="/pricing" className="text-primary text-sm underline">Выбрать тариф →</Link>
          </div>
        );
        return;
      }
    } catch {
      // ignore
    }

    setLoading(true);
    try {
      const fullPrompt = style ? `${prompt}, style: ${style}` : prompt;
      await toolsApi.saveGeneration("image-gen", fullPrompt);
      toast.success(
        <div>
          <p className="font-medium">Запрос принят!</p>
          <p className="text-sm opacity-70">Для генерации изображений подключите Google Flow или Stable Diffusion через API ключ</p>
        </div>,
        { duration: 5000 }
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="image-gen" title="Генерация изображений" description="По промту или смена стиля фото" icon="ImagePlus">
        {() => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Описание изображения <span className="text-primary">*</span></label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Опишите что хотите увидеть. Например: девушка в кафе, утренний свет, тёплые тона, портрет"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:border-primary/50"
                />
                <p className="text-xs text-white/25 mt-1">Подсказка: используй фото-рулетку для идей промтов</p>
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
                {loading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую...</> : <><Icon name="ImagePlus" size={16} className="mr-2" />Создать изображение</>}
              </Button>
            </div>

            <div className="glass rounded-xl p-5 border border-white/5">
              <p className="tag-pill text-white/30 mb-3 text-xs">О ГЕНЕРАЦИИ ИЗОБРАЖЕНИЙ</p>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <Icon name="Zap" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/50">Используется бесплатная модель Stable Diffusion. Для более качественных результатов подключи свой API ключ в настройках.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <Icon name="Palette" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/50">Совет: добавь к промту слова "фотореалистично", "8K", "профессиональный" для лучшего качества</p>
                </div>
                <div className="flex gap-3 items-start">
                  <Icon name="Shuffle" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/50">
                    Нужны идеи? Попробуй{" "}
                    <Link to="/tools/roulette" className="text-primary hover:text-primary/80 underline">Фото-рулетку</Link> — получи случайный промт для крутого фото
                  </p>
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
