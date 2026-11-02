import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { GuestOnly, RequireAdmin, RequireAuth } from "./auth/guards";
import { FullScreenLoader } from "./components/ui";
import AppShell from "./components/AppShell";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Users = lazy(() => import("./pages/Users"));

export default function App() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<GuestOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/resetar-senha" element={<ResetPassword />} />
        </Route>

        <Route path="/app" element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="projetos/:id" element={<ProjectDetail />} />
            <Route element={<RequireAdmin />}>
              <Route path="usuarios" element={<Users />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
