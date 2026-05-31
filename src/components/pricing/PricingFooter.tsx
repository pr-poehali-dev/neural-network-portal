import Icon from "@/components/ui/icon";

const ALL_TOOLS = [
  { icon: "Wand2",         label: "Генерация постов" },
  { icon: "LayoutTemplate",label: "Пост-карусель" },
  { icon: "Clapperboard",  label: "Сценарии для видео" },
  { icon: "CalendarDays",  label: "Контент-план" },
  { icon: "ImagePlus",     label: "Генерация изображений" },
  { icon: "Presentation",  label: "Презентации PPTX" },
  { icon: "Hash",          label: "Хэштег-анализатор" },
  { icon: "UserCircle",    label: "Шапка профиля" },
  { icon: "RefreshCw",     label: "Переупаковщик" },
  { icon: "UserCircle2",   label: "ИИ-аватар бренда" },
  { icon: "Smartphone",    label: "Генератор Stories" },
  { icon: "Shield",        label: "Бренд-кит" },
  { icon: "MessageSquare", label: "Скрипт продаж" },
  { icon: "Mail",          label: "Email-копирайтер" },
  { icon: "Search",        label: "Анализ конкурентов" },
  { icon: "Trophy",        label: "Кейсы и отзывы" },
  { icon: "Sparkles",      label: "Названия и слоганы" },
  { icon: "Megaphone",     label: "Рекламные объявления" },
  { icon: "MessageCircle", label: "Комментарии" },
  { icon: "BarChart3",     label: "Анализ профиля" },
  { icon: "TrendingUp",    label: "Воронки продаж" },
  { icon: "BookOpen",      label: "Гайды и чеклисты" },
  { icon: "ShoppingBag",   label: "Карточки товаров" },
  { icon: "FileVideo",     label: "Аналитика Reels" },
  { icon: "Shuffle",       label: "Фото-рулетка" },
];

const FAQ = [
  { q: "Как происходит оплата?", a: "Оплата через ЮКассу — безопасный российский сервис. Принимаем карты (Visa, Мир), СБП, ЮMoney и другие способы." },
  { q: "Когда активируется подписка?", a: "Сразу после подтверждения оплаты — автоматически. Обычно это занимает несколько секунд." },
  { q: "Можно ли получить возврат?", a: "Да, в течение 14 дней после оплаты если вы не использовали генерации. Напишите в поддержку." },
  { q: "Что если я уже плачу?", a: "При покупке нового тарифа он начнёт действовать с момента истечения текущего, или можно перейти сразу — напишите нам." },
];

const PAYMENT_METHODS = ["Карты Мир", "Visa / MC", "СБП", "ЮMoney", "QIWI"];

export default function PricingFooter() {
  return (
    <>
      {/* Все инструменты */}
      <div className="mt-16 glass rounded-xl p-8 border border-white/5">
        <h2 className="text-xl font-display font-bold text-white mb-2 text-center">Все 25 инструментов включены</h2>
        <p className="text-white/40 text-sm text-center mb-8">В любом платном тарифе — полный доступ к платформе</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {ALL_TOOLS.map((tool) => (
            <div key={tool.label} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
              <Icon name={tool.icon} size={13} className="text-primary flex-shrink-0" />
              <span className="text-xs text-white/60 truncate">{tool.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 glass rounded-xl p-8 border border-white/5">
        <h2 className="text-xl font-display font-bold text-white mb-6 text-center">Часто задаваемые вопросы</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {FAQ.map((item) => (
            <div key={item.q} className="space-y-1">
              <p className="text-white font-medium text-sm flex items-start gap-2">
                <Icon name="HelpCircle" size={14} className="text-primary mt-0.5 flex-shrink-0" />
                {item.q}
              </p>
              <p className="text-sm text-white/40 pl-5">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Способы оплаты */}
      <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
        <span className="text-xs text-white/20">Принимаем:</span>
        {PAYMENT_METHODS.map((m) => (
          <span key={m} className="tag-pill bg-white/5 text-white/30 px-3 py-1.5 rounded-lg text-xs border border-white/5">
            {m}
          </span>
        ))}
        <div className="flex items-center gap-1 text-xs text-white/20">
          <Icon name="Lock" size={11} />
          Защищено ЮКассой
        </div>
      </div>
    </>
  );
}
