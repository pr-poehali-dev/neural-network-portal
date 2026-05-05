import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { CATEGORIES } from "./prompts-data";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  filteredCount: number;
};

export default function PromptsFilters({
  search,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  filteredCount,
}: Props) {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по промтам..."
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/40"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                activeCategory === cat
                  ? "bg-primary text-black border-primary"
                  : "bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-white/30 mb-6">
        Найдено: <span className="text-white/60">{filteredCount}</span> промтов
      </p>
    </>
  );
}
