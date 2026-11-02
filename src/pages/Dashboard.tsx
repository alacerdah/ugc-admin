import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { FolderKanban, Globe, LayoutList, Plus, Video, X } from "lucide-react";
import { useAccount } from "../auth/AuthProvider";
import { api, errorMessage } from "../lib/api";
import type { Project } from "../lib/types";
import { suggestSlug, validateSlug } from "../shared/slug";
import { Alert, Button, GlassCard, PageHeader, TextField } from "../components/ui";

function NewProjectForm({ onCreated, onCancel }: { onCreated: (p: Project) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const slugError = slug ? validateSlug(slug) : "Escolha o slug do projeto.";

  const onName = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(suggestSlug(value));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");
    if (slugError || name.trim().length < 2) return;
    setLoading(true);
    try {
      onCreated(await api<Project>("/projects", { method: "POST", body: { name, slug } }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard strong className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Novo projeto</h2>
        <button type="button" onClick={onCancel} className="rounded-full p-2 text-ink-soft hover:bg-white hover:text-ink" aria-label="Cancelar">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Nome"
            placeholder="Ex: Ariana"
            value={name}
            onChange={(e) => onName(e.target.value)}
            error={submitted && name.trim().length < 2 ? "Informe o nome do projeto." : undefined}
            required
          />
          <TextField
            label="Slug"
            placeholder="ariana"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            hint="É o identificador que o site da criadora usa pra buscar os vídeos. Não muda depois."
            error={submitted || (slugTouched && slug) ? slugError || undefined : undefined}
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} icon={<Plus className="size-4" aria-hidden />}>
            Criar projeto
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}

export default function Dashboard() {
  const { user } = useAccount();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api<Project[]>("/projects")
      .then(setProjects)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projetos"
        description="Cada site de criadora é um projeto, com seus próprios nichos e links de vídeo."
        action={
          user.role === "admin" &&
          !creating && (
            <Button onClick={() => setCreating(true)} icon={<Plus className="size-4" aria-hidden />}>
              Novo projeto
            </Button>
          )
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      {creating && (
        <NewProjectForm
          onCancel={() => setCreating(false)}
          onCreated={(p) => {
            setProjects((list) => [...(list ?? []), p]);
            setCreating(false);
          }}
        />
      )}

      {projects === null && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="glass h-40 animate-pulse rounded-3xl" />
          ))}
        </div>
      )}

      {projects?.length === 0 && !creating && (
        <GlassCard className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-soft to-purple-soft text-blue">
            <FolderKanban className="size-6" aria-hidden />
          </span>
          <p className="text-ink-soft">Nenhum projeto ainda.</p>
        </GlassCard>
      )}

      {projects && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} to={`/app/projetos/${p.id}`}>
              <GlassCard className="flex h-full flex-col gap-4 p-5 transition hover:bg-white/70">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-soft to-purple-soft text-blue">
                    <FolderKanban className="size-5" aria-hidden />
                  </span>
                  <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-bold text-ink-soft">/{p.slug}</span>
                </div>
                <div>
                  <h2 className="font-bold text-ink">{p.name}</h2>
                  {p.domain && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-ink-soft">
                      <Globe className="size-3.5 shrink-0" aria-hidden />
                      {p.domain}
                    </p>
                  )}
                </div>
                <div className="mt-auto flex items-center gap-4 text-sm text-ink-soft">
                  <span className="flex items-center gap-1.5">
                    <LayoutList className="size-4" aria-hidden />
                    {p.niche_count ?? 0} nichos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Video className="size-4" aria-hidden />
                    {p.link_count ?? 0} links
                  </span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
