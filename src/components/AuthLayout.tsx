import type { ReactNode } from "react";
import { FolderKanban, LayoutList, Users } from "lucide-react";
import { GlassCard, Logo } from "./ui";

const HIGHLIGHTS = [
  { icon: FolderKanban, text: "Um projeto por site de criadora, cada um com seu próprio slug" },
  { icon: LayoutList, text: "Nichos com links de vídeo, ordenados do jeito que você quiser" },
  { icon: Users, text: "Controle quem da equipe acessa o quê" },
];

export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="app-backdrop" aria-hidden />

      <section className="hidden flex-col justify-between p-12 lg:flex">
        <Logo />
        <div className="max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-ink">
            Conteúdo dos seus projetos, <span className="text-gradient">num lugar só</span>.
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="glass flex items-center gap-3 rounded-2xl px-4 py-3 text-ink-soft">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue">
                  <Icon className="size-5" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-ink-faint">© {new Date().getFullYear()} UGC Admin</p>
      </section>

      <section className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          <GlassCard strong className="p-6 sm:p-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
            <p className="mt-1 text-ink-soft">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
