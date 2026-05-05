import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { toolsApi, AiTool } from "@/lib/api";

const CATEGORIES = ["Все", "Изображения", "Текст", "Видео", "Дизайн", "Аудио", "Поиск"];
const PRICING = ["Все", "Бесплатный", "Freemium", "Платный"];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="12" height="12" viewBox="0 0 12 12" className={rating >= s ? "text-yellow-400" : "text-white/15"} fill="currentColor">
          <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9.2,11 6,9.2 2.8,11 3.5,7.5 1,5 4.5,4.5" />
        </svg>
      ))}
      <span className="text-xs text-white/40 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

const PRICING_COLORS: Record<string, string> = {
  "Бесплатный": "text-green-400 bg-green-400/10",
  "Freemium": "text-blue-400 bg-blue-400/10",
  "Платный": "text-orange-400 bg-orange-400/10",
};

export default function Catalog() {
  const [tools, setTools] = useState<AiTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Все");
  const [pricing, setPricing] = useState("Все");
  const [sort, setSort] = useState("rating");

  useEffect(() => {
    setLoading(true);
    toolsApi
      .getCatalog({
        category: category !== "Все" ? category : undefined,
        pricing: pricing !== "Все" ? pricing : undefined,
        search: search || undefined,
        sort,
      })
      .then((d) => setTools(d.tools))
      .finally(() => setLoading(false));
  }, [category, pricing, search, sort]);

  const featured = tools.filter((t) => t.is_featured);
  const rest = tools.filter((t) => !t.is_featured);

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="tag-pill text-primary/60 mb-2">КАТАЛОГ</p>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-3">
            Нейросети для контента
          </h1>
          <p className="text-white/40">Лучшие ИИ-инструменты с фильтрацией по типу и цене</p>
        </div>

        <div className="glass rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск нейросетей..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white/5 border border-white/10 text-white/60 text-sm rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="rating">По рейтингу</option>
              <option value="votes">По популярности</option>
              <option value="name">По названию</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                category === c
                  ? "bg-primary text-black font-medium"
                  : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap mb-10">
          <span className="text-xs text-white/30 self-center mr-1">Цена:</span>
          {PRICING.map((p) => (
            <button
              key={p}
              onClick={() => setPricing(p)}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                pricing === p
                  ? "bg-white/20 text-white font-medium"
                  : "bg-white/5 text-white/40 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <Icon name="Loader2" size={24} className="animate-spin mr-2" />
            Загрузка...
          </div>
        ) : (
          <>
            {featured.length > 0 && category === "Все" && !search && (
              <div className="mb-10">
                <p className="tag-pill text-primary/50 mb-4">РЕКОМЕНДУЕМ</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featured.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} featured />
                  ))}
                </div>
              </div>
            )}

            {rest.length > 0 && (
              <div>
                {featured.length > 0 && category === "Все" && !search && (
                  <p className="tag-pill text-white/30 mb-4">ВСЕ ИНСТРУМЕНТЫ</p>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {(featured.length > 0 && category === "Все" && !search ? rest : tools).map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            )}

            {tools.length === 0 && (
              <div className="text-center py-20 text-white/30">
                <Icon name="SearchX" size={40} className="mx-auto mb-4 opacity-30" />
                <p>Ничего не найдено. Попробуй другой запрос.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ToolCard({ tool, featured = false }: { tool: AiTool; featured?: boolean }) {
  const letters = tool.name.slice(0, 2).toUpperCase();
  const colorClass = PRICING_COLORS[tool.pricing_type] || "text-white/40 bg-white/5";

  return (
    <div className={`glass card-hover rounded-xl border border-white/5 hover:border-primary/20 ${featured ? "p-5" : "p-4"}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-display font-bold text-sm flex-shrink-0">
          {letters}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-white text-sm truncate">{tool.name}</h3>
          <span className={`tag-pill px-1.5 py-0.5 rounded text-[10px] ${colorClass}`}>
            {tool.pricing_type}
          </span>
        </div>
      </div>
      <p className="text-xs text-white/40 mb-3 line-clamp-2">{tool.description}</p>
      <StarRating rating={tool.rating} />
      {tool.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-3">
          {tool.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag-pill text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">
              {tag}
            </span>
          ))}
        </div>
      )}
      {tool.website_url && (
        <a
          href={tool.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1 text-xs text-primary/60 hover:text-primary transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Открыть <Icon name="ExternalLink" size={11} />
        </a>
      )}
    </div>
  );
}
