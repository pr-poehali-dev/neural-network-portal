import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/dashboard", label: "Мой кабинет", authOnly: true },
  { href: "/tools", label: "Инструменты" },
  { href: "/prompts", label: "Промты" },
  { href: "/catalog", label: "Каталог ИИ" },
  { href: "/pricing", label: "Тарифы" },
];

export default function Navbar() {
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-display font-bold neon-text tracking-wider">NEURAL</span>
            <span className="text-xs tag-pill bg-primary/20 text-primary px-2 py-0.5 rounded-sm">AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.authOnly && !user) return null;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2 text-sm transition-colors rounded-md ${
                    location.pathname === link.href
                      ? "text-primary"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-medium text-xs">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="hidden md:block">{user.name}</span>
                    <Icon name="ChevronDown" size={14} className="text-white/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/90 border-white/10 min-w-[180px]">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="text-white/80 hover:text-white cursor-pointer">
                      <Icon name="User" size={14} className="mr-2" /> Профиль
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/referral" className="text-white/80 hover:text-white cursor-pointer">
                      <Icon name="Users" size={14} className="mr-2" /> Реферальная программа
                    </Link>
                  </DropdownMenuItem>
                  {user.is_admin && (
                    <>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="text-primary hover:text-primary/80 cursor-pointer">
                          <Icon name="Shield" size={14} className="mr-2" /> Панель администратора
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={logout} className="text-red-400 hover:text-red-300 cursor-pointer">
                    <Icon name="LogOut" size={14} className="mr-2" /> Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setAuthOpen(true)}
                size="sm"
                className="bg-primary text-black font-medium hover:bg-primary/90"
              >
                Войти
              </Button>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-white/60 hover:text-white"
            >
              <Icon name={mobileOpen ? "X" : "Menu"} size={20} />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 py-3 px-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              if (link.authOnly && !user) return null;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 text-sm rounded-lg transition-colors ${
                    location.pathname === link.href
                      ? "text-primary bg-primary/10"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}