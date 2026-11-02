import { NavLink, Outlet } from "react-router";
import { FolderKanban, LogOut, Users } from "lucide-react";
import { useAccount, useAuth } from "../auth/AuthProvider";
import { Logo } from "./ui";

const NAV = [
  { to: "/app", label: "Projetos", icon: FolderKanban, end: true },
  { to: "/app/usuarios", label: "Usuários", icon: Users, end: false, adminOnly: true },
];

export default function AppShell() {
  const { user } = useAccount();
  const { logout } = useAuth();
  const nav = NAV.filter((item) => !item.adminOnly || user.role === "admin");

  return (
    <div className="min-h-screen lg:flex">
      <div className="app-backdrop" aria-hidden />

      {/* desktop: barra lateral de vidro */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 p-4 lg:block">
        <div className="glass flex h-full flex-col rounded-3xl p-5">
          <Logo />
          <nav className="mt-8 flex flex-col gap-1" aria-label="Principal">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-gradient-to-r from-blue to-purple text-white shadow-[0_10px_24px_-12px_rgb(91_92_255/0.8)]"
                      : "text-ink-soft hover:bg-white/70 hover:text-ink"
                  }`
                }
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink/5 pt-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-ink-soft">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-full p-2 text-ink-soft transition hover:bg-white/80 hover:text-ink"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      {/* celular e tablet: topo com logo e sair */}
      <header className="sticky top-0 z-20 p-3 lg:hidden">
        <div className="glass flex items-center justify-between rounded-2xl px-4 py-2.5">
          <Logo />
          <button
            type="button"
            onClick={logout}
            className="rounded-full p-2 text-ink-soft transition hover:bg-white/80 hover:text-ink"
            aria-label="Sair"
          >
            <LogOut className="size-5" aria-hidden />
          </button>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-2 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      {/* celular e tablet: navegação fixa embaixo, no alcance do polegar */}
      <nav
        className="glass fixed inset-x-3 bottom-3 z-20 flex justify-around rounded-2xl px-2 py-2 lg:hidden"
        aria-label="Principal"
      >
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-w-20 flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                isActive ? "bg-gradient-to-r from-blue to-purple text-white" : "text-ink-soft"
              }`
            }
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
