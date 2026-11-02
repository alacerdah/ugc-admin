import { Navigate, Outlet, useLocation } from "react-router";
import { useAccount, useAuth } from "./AuthProvider";
import { FullScreenLoader } from "../components/ui";

export function RequireAuth() {
  const { account } = useAuth();
  const location = useLocation();
  if (account === undefined) return <FullScreenLoader />;
  if (account === null) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

// quem manda a pessoa pra dentro depois do login/cadastro é este guarda (e não a tela),
// então é ele que precisa lembrar a página que ela tentou abrir antes de ser barrada
export function GuestOnly() {
  const { account } = useAuth();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/app";
  if (account === undefined) return <FullScreenLoader />;
  if (account) return <Navigate to={from} replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { role } = useAccount().user;
  if (role !== "admin") return <Navigate to="/app" replace />;
  return <Outlet />;
}
