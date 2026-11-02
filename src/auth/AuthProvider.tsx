import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import type { Account } from "../lib/types";

type RegisterInput = { name: string; email: string; password: string };

type AuthValue = {
  // undefined = ainda checando a sessão; null = deslogado
  account: Account | null | undefined;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null | undefined>(undefined);

  useEffect(() => {
    api<Account>("/me")
      .then(setAccount)
      .catch((e) => {
        if (e instanceof ApiError) setAccount(null);
        else setAccount(null);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAccount(await api<Account>("/auth/login", { method: "POST", body: { email, password } }));
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setAccount(await api<Account>("/auth/register", { method: "POST", body: input }));
  }, []);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setAccount(null);
  }, []);

  const value = useMemo(() => ({ account, login, register, logout }), [account, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}

// dentro das telas do /app a sessão já foi garantida pelo RequireAuth
export function useAccount() {
  const { account } = useAuth();
  if (!account) throw new Error("useAccount usado fora de uma rota protegida");
  return account;
}
