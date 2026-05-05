import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

interface ResultBoxProps {
  result: string;
  loading?: boolean;
  label?: string;
}

export default function ResultBox({ result, loading, label = "Результат" }: ResultBoxProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Скопировано!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-xl border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="tag-pill text-white/40 text-xs">{label}</span>
        {result && (
          <Button
            size="sm"
            variant="ghost"
            onClick={copy}
            className="text-white/40 hover:text-white h-7 px-2 text-xs"
          >
            <Icon name={copied ? "Check" : "Copy"} size={13} className="mr-1" />
            {copied ? "Скопировано" : "Копировать"}
          </Button>
        )}
      </div>
      <div className="p-4 min-h-[200px]">
        {loading ? (
          <div className="flex items-center gap-3 text-white/30 mt-8 justify-center">
            <Icon name="Loader2" size={20} className="animate-spin" />
            <span className="text-sm">Генерирую...</span>
          </div>
        ) : result ? (
          <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans leading-relaxed">{result}</pre>
        ) : (
          <p className="text-white/20 text-sm text-center mt-8">Результат появится здесь</p>
        )}
      </div>
    </div>
  );
}
