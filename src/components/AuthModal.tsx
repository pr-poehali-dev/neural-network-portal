import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({ open, onClose, defaultTab = "login" }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
        toast.success("Добро пожаловать!");
      } else {
        await register(email, password, name, refCode || undefined);
        toast.success("Аккаунт создан! Добро пожаловать!");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md glass border-white/10 bg-black/90">
        <DialogTitle className="sr-only">Авторизация</DialogTitle>
        <div className="p-2">
          <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-lg">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === "login" ? "bg-primary text-black" : "text-white/60 hover:text-white"}`}
            >
              Войти
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === "register" ? "bg-primary text-black" : "text-white/60 hover:text-white"}`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "register" && (
              <div>
                <label className="text-sm text-white/60 mb-1 block">Ваше имя</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Как вас зовут?"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            )}
            <div>
              <label className="text-sm text-white/60 mb-1 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Пароль</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            {tab === "register" && (
              <div>
                <label className="text-sm text-white/60 mb-1 block">Реферальный код (необязательно)</label>
                <Input
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  placeholder="Код пригласившего"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                <p className="text-xs text-white/30 mt-1">Если вас пригласил друг — введите его код</p>
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-semibold hover:bg-primary/90 mt-2"
            >
              {loading ? "Загрузка..." : tab === "login" ? "Войти" : "Создать аккаунт"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
