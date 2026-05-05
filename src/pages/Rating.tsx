import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";
import { toolsApi, AiTool } from "@/lib/api";

const CATEGORY_ICONS: Record<string, string> = {
  "Изображения": "ImagePlus",
  "Текст":       "FileText",
  "Видео":       "Video",
  "Дизайн":      "Palette",
  "Аудио":       "Music",
  "Поиск":       "Search",
  "Аналитика":   "BarChart3",
  "Чат-боты":    "MessageCircle",
};

const MEDAL_COLORS = [
  "text-yellow-400",   // 1 место — золото
  "text-slate-300",    // 2 место — серебро
  "text-amber-600",    // 3 место — бронза
];

export default function Rating() {
  const [tools, setTools] = useState<AiTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");

  useEffect(() => {
    toolsApi.getCatalog({ sort: "rating" })
      .then((d) => setTools(d.tools))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["Все", ...Array.from(new Set(tools.map(t => t.category))).sort()];

  const filtered = activeCategory === "Все"
    ? tools
    : tools.filter(t => t.category === activeCategory);

  const grouped = filtered.reduce<Record<string, AiTool[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  const totalTools = tools.length;
  const topRated = tools.filter(t => t.rating >= 4.5).length;
  const featured = tools.filter(t => t.is_featured).length;

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-5xl mx-auto">

        {/* Заголовок */}
        <div className="mb-10">
          <p className="tag-pill text-primary/60 mb-2">РЕЙТИНГ</p>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-3">Лучшие нейросети</h1>
          <p className="text-white/40 max-w-xl">
            Рейтинг ИИ-инструментов по категориям — от генерации изображений до работы с текстом и видео
          </p>
        </div>

        {/* Статистика */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { value: totalTools, label: "инструментов", icon: "Sparkles" },
              { value: topRated,   label: "с рейтингом 4.5+", icon: "Star" },
              { value: featured,   label: "рекомендуем", icon: "Trophy" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl border border-white/5 p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Icon name={s.icon} size={14} className="text-primary" />
                  <span className="text-2xl font-display font-bold text-primary">{s.value}</span>
                </div>
                <p className="text-xs text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Фильтры */}
        {!loading && categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  activeCategory === cat
                    ? "bg-primary text-black border-primary"
                    : "bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat !== "Все" && CATEGORY_ICONS[cat] && (
                  <Icon name={CATEGORY_ICONS[cat]} size={12} />
                )}
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <Icon name="Loader2" size={24} className="animate-spin mr-2" />
            Загружаем рейтинг...
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Icon name="SearchX" size={32} className="mx-auto mb-3 opacity-50" />
            <p>Инструменты не найдены</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([cat, catTools]) => {
              const sorted = [...catTools].sort((a, b) => b.rating - a.rating);
              return (
                <div key={cat}>
                  <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                    {CATEGORY_ICONS[cat] && (
                      <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                        <Icon name={CATEGORY_ICONS[cat]} size={14} className="text-primary" />
                      </div>
                    )}
                    {cat}
                    <span className="text-white/20 text-sm font-normal">{sorted.length} инструментов</span>
                  </h2>
                  <div className="space-y-2">
                    {sorted.map((tool, i) => (
                      <div
                        key={tool.id}
                        className={`glass rounded-xl border p-4 flex items-center gap-4 hover:border-primary/20 transition-colors ${
                          i === 0 ? "border-yellow-500/20 bg-yellow-500/[0.03]" : "border-white/5"
                        }`}
                      >
                        {/* Позиция */}
                        <span className={`text-lg font-display font-bold w-8 text-center flex-shrink-0 ${
                          i < 3 ? MEDAL_COLORS[i] : "text-white/20"
                        }`}>
                          {i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}
                        </span>

                        {/* Лого */}
                        {tool.logo_url ? (
                          <img src={tool.logo_url} alt={tool.name}
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 border border-primary/10">
                            {tool.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        {/* Инфо */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display font-bold text-white text-sm">{tool.name}</h3>
                            {tool.is_featured && (
                              <span className="tag-pill bg-primary/15 text-primary text-[9px] px-1.5 py-0.5 rounded">ТОП</span>
                            )}
                            {tool.tags?.slice(0, 2).map(tag => (
                              <span key={tag} className="tag-pill bg-white/5 text-white/30 text-[9px] px-1.5 py-0.5 rounded">{tag}</span>
                            ))}
                          </div>
                          <p className="text-xs text-white/35 truncate mt-0.5">{tool.description}</p>
                        </div>

                        {/* Рейтинг */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <Icon name="Star" size={12} className="text-yellow-400" />
                            <span className="text-sm font-bold text-white/80">{tool.rating.toFixed(1)}</span>
                          </div>
                          {tool.votes > 0 && (
                            <span className="text-[10px] text-white/20">{tool.votes} голосов</span>
                          )}
                        </div>

                        {/* Ссылка */}
                        {tool.website_url && (
                          <a href={tool.website_url} target="_blank" rel="noopener noreferrer"
                            className="text-white/20 hover:text-primary transition-colors flex-shrink-0">
                            <Icon name="ExternalLink" size={14} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
