import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { toolsApi } from "@/lib/api";
import { toast } from "sonner";

interface ToolWrapperProps {
  toolSlug: string;
  title: string;
  description: string;
  icon: string;
  children: (onGenerate: () => Promise<boolean>) => React.ReactNode;
}

export default function ToolWrapper({ toolSlug, title, description, icon, children }: ToolWrapperProps) {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const onGenerate = async (): Promise<boolean> => {
    if (!user) {
      setAuthOpen(true);
      return false;
    }

    try {
      const result = await toolsApi.checkLimit(toolSlug);
      if (!result.allowed) {
        toast.error(
          <div>
            <p className="font-medium">Лимит генераций исчерпан</p>
            <p className="text-sm opacity-70">Выбери тариф для продолжения</p>
            <Link to="/pricing" className="text-primary text-sm underline mt-1 block">Посмотреть тарифы →</Link>
          </div>,
          { duration: 5000 }
        );
        return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/tools" className="text-white/30 hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={18} />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Icon name={icon} size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white">{title}</h1>
            <p className="text-xs text-white/40">{description}</p>
          </div>
          {!user && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-white/30">Нужна авторизация</span>
              <Button
                size="sm"
                onClick={() => setAuthOpen(true)}
                className="bg-primary text-black font-medium hover:bg-primary/90 text-xs"
              >
                Войти
              </Button>
            </div>
          )}
        </div>

        {children(onGenerate)}
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
