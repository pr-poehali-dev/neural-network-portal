import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";
import { toolsApi, AiTool } from "@/lib/api";

export default function Rating() {
  const [tools, setTools] = useState<AiTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    toolsApi.getCatalog({ sort: "rating" }).then((d) => setTools(d.tools)).finally(() => setLoading(false));
  }, []);

  const grouped = tools.reduce<Record<string, AiTool[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
        <div className="mb-10">
          <p className="tag-pill text-primary/60 mb-2">РЕЙТИНГ</p>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-3">Лучшие нейросети</h1>
          <p className="text-white/40">Топ ИИ-инструментов по категориям</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <Icon name="Loader2" size={24} className="animate-spin mr-2" /> Загрузка...
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([cat, catTools]) => (
              <div key={cat}>
                <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  {cat}
                </h2>
                <div className="space-y-2">
                  {catTools.sort((a, b) => b.rating - a.rating).map((tool, i) => (
                    <div key={tool.id} className="glass rounded-xl border border-white/5 p-4 flex items-center gap-4 hover:border-primary/20 transition-colors">
                      <span className={`text-lg font-display font-bold w-8 text-center ${i === 0 ? "neon-text" : i === 1 ? "text-yellow-400/60" : i === 2 ? "text-orange-400/60" : "text-white/20"}`}>
                        {i + 1}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {tool.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-white text-sm">{tool.name}</h3>
                          {tool.is_featured && <span className="tag-pill bg-primary/15 text-primary text-[9px] px-1.5 py-0.5 rounded">ТОП</span>}
                        </div>
                        <p className="text-xs text-white/35 truncate">{tool.description}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 12 12" className="text-yellow-400" fill="currentColor">
                          <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9.2,11 6,9.2 2.8,11 3.5,7.5 1,5 4.5,4.5" />
                        </svg>
                        <span className="text-sm font-medium text-white/70">{tool.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
