import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const TOOL_NAMES: Record<string, string> = {
  "post":         "Генерация постов",
  "carousel":     "Пост-карусель",
  "scenario":     "Сценарии для видео",
  "content-plan": "Контент-план",
  "profile":      "Анализ профиля",
  "funnel":       "Воронки продаж",
  "presentation": "Презентации",
  "guide":        "Гайды и чеклисты",
  "product-card": "Карточки товаров",
  "reels":        "Аналитика Reels",
  "image-gen":    "Генерация изображений",
  "roulette":     "Фото-рулетка",
  "hashtags":     "Хэштег-анализатор",
  "bio":          "Шапка профиля",
  "repurpose":    "Переупаковщик контента",
  "avatar":       "ИИ-аватар бренда",
  "stories":      "Генератор Stories",
  "brand-kit":    "Бренд-кит",
  "sale-script":  "Скрипт продаж",
  "email":        "Email-копирайтер",
  "competitor":   "Анализ конкурентов",
  "case":         "Кейсы и отзывы",
  "naming":       "Названия и слоганы",
  "ad-copy":      "Рекламные объявления",
  "comments":     "Комментарии для прогрева",
};

interface Props {
  toolSelectFor: string;
  selectedTool: string;
  paying: string | null;
  onSelectTool: (slug: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function PricingToolSelectModal({
  toolSelectFor,
  selectedTool,
  paying,
  onSelectTool,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="glass rounded-2xl border border-white/10 p-6 max-w-sm w-full">
        <h3 className="font-display font-bold text-white text-xl mb-2">Выбери инструмент</h3>
        <p className="text-sm text-white/40 mb-5">Тариф будет действовать только для этого инструмента</p>
        <div className="grid grid-cols-2 gap-2 mb-5 max-h-64 overflow-y-auto">
          {Object.entries(TOOL_NAMES).map(([slug, name]) => (
            <button
              key={slug}
              onClick={() => onSelectTool(slug)}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${
                selectedTool === slug
                  ? "bg-primary text-black font-medium"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-white/10 text-white/60 hover:text-white"
          >
            Отмена
          </Button>
          <Button
            disabled={!selectedTool || paying === toolSelectFor}
            onClick={onConfirm}
            className="flex-1 bg-primary text-black font-semibold hover:bg-primary/90"
          >
            {paying === toolSelectFor ? (
              <Icon name="Loader2" size={14} className="animate-spin" />
            ) : (
              "Оплатить"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
