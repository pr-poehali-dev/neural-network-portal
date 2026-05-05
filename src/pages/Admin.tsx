import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { adminApi, AdminStats, AdminUser } from "@/lib/api";
import { toast } from "sonner";

export default function Admin() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"stats" | "users" | "founder">("stats");
  const [founderEmail, setFounderEmail] = useState("");
  const [grantUserId, setGrantUserId] = useState("");
  const [grantPlan, setGrantPlan] = useState("unlimited_month");
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (user?.is_admin) {
      adminApi.stats().then(setStats).catch(() => {});
      adminApi.users().then((d) => setUsers(d.users)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user?.is_admin && tab === "users") {
      adminApi.users(search).then((d) => setUsers(d.users)).catch(() => {});
    }
  }, [search, tab, user]);

  if (!loading && (!user || !user.is_admin)) return <Navigate to="/" />;
  if (loading) return null;

  const grantAccess = async () => {
    if (!grantUserId) { toast.error("Введите ID пользователя"); return; }
    setLoadingAction(true);
    try {
      await adminApi.grantAccess(Number(grantUserId), grantPlan, 1);
      toast.success("Доступ предоставлен!");
      adminApi.users().then((d) => setUsers(d.users));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoadingAction(false);
    }
  };

  const setupFounder = async () => {
    if (!founderEmail) { toast.error("Введите email"); return; }
    setLoadingAction(true);
    try {
      const result = await adminApi.setupFounder(founderEmail);
      toast.success(result.message);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoadingAction(false);
    }
  };

  const makeAdmin = async (userId: number) => {
    try {
      await adminApi.makeAdmin(userId);
      toast.success("Пользователь стал администратором");
      adminApi.users().then((d) => setUsers(d.users));
    } catch {
      toast.error("Ошибка");
    }
  };

  const PLANS = [
    { slug: "start_3", name: "Старт (3 ген.)" },
    { slug: "basic_5", name: "Базовый (5 ген.)" },
    { slug: "advanced_10", name: "Продвинутый (10 ген.)" },
    { slug: "unlimited_month", name: "Безлимит 1 мес" },
    { slug: "unlimited_3m", name: "Безлимит 3 мес" },
    { slug: "unlimited_6m", name: "Безлимит 6 мес" },
    { slug: "unlimited_year", name: "Безлимит 1 год" },
  ];

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Icon name="Shield" size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Панель администратора</h1>
            <p className="text-xs text-white/40">Управление пользователями и подписками</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { id: "stats", label: "Статистика", icon: "BarChart3" },
            { id: "users", label: "Пользователи", icon: "Users" },
            { id: "founder", label: "Настройки", icon: "Settings" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${tab === t.id ? "bg-primary text-black font-medium" : "bg-white/5 text-white/50 hover:text-white"}`}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "stats" && stats && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Пользователей", value: stats.total_users, icon: "Users" },
              { label: "Активных подписок", value: stats.active_subscriptions, icon: "Crown" },
              { label: "Всего генераций", value: stats.total_generations, icon: "Sparkles" },
              { label: "Рефералов", value: stats.total_referrals, icon: "Share2" },
              { label: "Новых за неделю", value: stats.new_users_week, icon: "TrendingUp" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl border border-white/5 p-5 text-center">
                <Icon name={s.icon} size={20} className="text-primary mx-auto mb-2" />
                <p className="text-2xl font-display font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/40 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по email или имени..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
              />
              <div className="glass rounded-lg border border-white/5 p-3 flex-shrink-0">
                <p className="text-xs text-white/40">Выдать доступ:</p>
                <div className="flex gap-2 mt-2">
                  <input
                    value={grantUserId}
                    onChange={(e) => setGrantUserId(e.target.value)}
                    placeholder="ID"
                    className="w-16 bg-white/5 border border-white/10 text-white text-sm rounded px-2 py-1"
                  />
                  <select
                    value={grantPlan}
                    onChange={(e) => setGrantPlan(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white text-xs rounded px-2 py-1"
                  >
                    {PLANS.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                  </select>
                  <Button size="sm" onClick={grantAccess} disabled={loadingAction}
                    className="bg-primary text-black text-xs px-3">
                    Выдать
                  </Button>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-white/30 text-xs">
                      <th className="text-left px-4 py-3">ID</th>
                      <th className="text-left px-4 py-3">Email / Имя</th>
                      <th className="text-left px-4 py-3">Подписка</th>
                      <th className="text-left px-4 py-3">Роль</th>
                      <th className="text-left px-4 py-3">Дата</th>
                      <th className="text-left px-4 py-3">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/2">
                        <td className="px-4 py-3 text-white/30">{u.id}</td>
                        <td className="px-4 py-3">
                          <p className="text-white/80">{u.email}</p>
                          <p className="text-xs text-white/30">{u.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          {u.subscription ? (
                            <span className="tag-pill bg-primary/15 text-primary px-2 py-0.5 rounded text-[10px]">{u.subscription}</span>
                          ) : (
                            <span className="text-white/20 text-xs">Нет</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.is_admin ? (
                            <span className="tag-pill bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded text-[10px]">ADMIN</span>
                          ) : (
                            <span className="text-white/20 text-xs">Пользователь</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white/30 text-xs">
                          {new Date(u.created_at).toLocaleDateString("ru")}
                        </td>
                        <td className="px-4 py-3">
                          {!u.is_admin && (
                            <button
                              onClick={() => makeAdmin(u.id)}
                              className="text-xs text-white/30 hover:text-primary transition-colors"
                            >
                              Сделать admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "founder" && (
          <div className="max-w-md space-y-6">
            <div className="glass rounded-xl border border-primary/20 p-6 bg-primary/5">
              <h2 className="text-white font-medium mb-2 flex items-center gap-2">
                <Icon name="Crown" size={16} className="text-primary" />
                Настроить основателя
              </h2>
              <p className="text-sm text-white/40 mb-4">
                Укажи email аккаунта, который должен иметь полный бесплатный доступ ко всем функциям
              </p>
              <div className="flex gap-2">
                <Input
                  value={founderEmail}
                  onChange={(e) => setFounderEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
                <Button onClick={setupFounder} disabled={loadingAction} className="bg-primary text-black hover:bg-primary/90 flex-shrink-0">
                  Применить
                </Button>
              </div>
              <p className="text-xs text-white/25 mt-2">Аккаунт получит права администратора + безлимитный годовой доступ</p>
            </div>

            <div className="glass rounded-xl border border-white/5 p-5">
              <h2 className="text-white font-medium mb-3">Текущий администратор</h2>
              <p className="text-white/60">{user!.email}</p>
              <p className="text-xs text-white/30 mt-1">ID: {user!.id} · Безлимитный доступ активен</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
