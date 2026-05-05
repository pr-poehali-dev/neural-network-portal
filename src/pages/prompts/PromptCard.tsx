import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { type Prompt, CATEGORY_COLORS } from "./prompts-data";

type Props = {
  prompt: Prompt;
  copiedId: string | null;
  onCopy: (prompt: Prompt) => void;
};

export default function PromptCard({ prompt, copiedId, onCopy }: Props) {
  return (
    <div className="glass border border-white/5 rounded-2xl p-5 flex flex-col hover:border-white/10 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon name={prompt.icon} size={17} className="text-white/60" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                CATEGORY_COLORS[prompt.category] || "bg-white/10 text-white/50 border-white/10"
              }`}
            >
              {prompt.category}
            </span>
          </div>
          <h3 className="font-semibold text-white text-sm leading-tight">{prompt.title}</h3>
        </div>
      </div>

      <p className="text-sm text-white/40 leading-relaxed line-clamp-3 flex-1 mb-4">
        {prompt.prompt}
      </p>

      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-white/30 text-xs mr-auto">
          <Icon name="Heart" size={13} />
          <span>{prompt.likes}</span>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onCopy(prompt)}
          className="h-8 px-3 text-xs text-white/50 hover:text-white hover:bg-white/10"
        >
          <Icon
            name={copiedId === prompt.id ? "Check" : "Copy"}
            size={13}
            className="mr-1.5"
          />
          {copiedId === prompt.id ? "Скопировано" : "Копировать"}
        </Button>

        <Link to={prompt.tool}>
          <Button
            size="sm"
            className="h-8 px-3 text-xs bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20"
            variant="ghost"
          >
            {prompt.toolLabel}
            <Icon name="ArrowRight" size={12} className="ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
