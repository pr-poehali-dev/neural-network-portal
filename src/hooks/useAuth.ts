import { useState, useEffect, createContext, useContext } from "react";
import { authApi, User } from "@/lib/api";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, ref_code?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const cached = localStorage.getItem("auth_user");
    if (token && cached) {
      try {
        setUser(JSON.parse(cached));
      } catch (e) { console.warn(e); }
      setLoading(false);
      authApi.me()
        .then((data) => {
          setUser(data.user);
          localStorage.setItem("auth_user", JSON.stringify(data.user));
        })
        .catch(() => {});
    } else if (token) {
      authApi.me()
        .then((data) => {
          setUser(data.user);
          localStorage.setItem("auth_user", JSON.stringify(data.user));
        })
        .catch(() => localStorage.removeItem("auth_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string, ref_code?: string) => {
    const data = await authApi.register(email, password, name, ref_code);
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
  };

  const refreshUser = async () => {
    const data = await authApi.me();
    setUser(data.user);
  };

  return { user, loading, login, register, logout, refreshUser };
}

export function useAuth() {
  return useContext(AuthContext);
}