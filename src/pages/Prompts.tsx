import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { PROMPTS_LIBRARY, type Prompt } from "./prompts/prompts-data";
import PromptsFilters from "./prompts/PromptsFilters";
import PromptCard from "./prompts/PromptCard";
import PromptsEmpty from "./prompts/PromptsEmpty";

export default function Prompts() {
  const [activeCategory, setActiveCategory] = useState("Все");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return PROMPTS_LIBRARY.filter((p) => {
      const matchCategory = activeCategory === "Все" || p.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [activeCategory, search]);

  const handleCopy = (prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.prompt).then(() => {
      setCopiedId(prompt.id);
      toast.success("Промт скопирован!", { description: prompt.title });
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-28 pb-20">
        <div className="mb-10">
          <p className="tag-pill text-primary/60 mb-3 text-xs tracking-widest uppercase">Готовые промты</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Библиотека промтов
          </h1>
          <p className="text-white/50 text-lg max-w-2xl">
            Проверенные промты для создания контента. Копируй, адаптируй под свою нишу и используй в инструментах.
          </p>
        </div>

        <PromptsFilters
          search={search}
          onSearchChange={setSearch}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          filteredCount={filtered.length}
        />

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            ))}
          </div>
        ) : (
          <PromptsEmpty />
        )}
      </div>
    </div>
  );
}
