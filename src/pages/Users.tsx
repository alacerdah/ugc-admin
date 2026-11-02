import { useEffect, useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, Trash2, UserPlus, X } from "lucide-react";
import { useAccount } from "../auth/AuthProvider";
import { api, errorMessage } from "../lib/api";
import type { Project, Role, User } from "../lib/types";
import { Alert, Badge, Button, GlassCard, PageHeader, SelectField, TextField } from "../components/ui";

const ROLE_LABEL: Record<Role, string> = { admin: "Admin", editor: "Editor" };

function InviteForm({
  projects,
  onInvited,
  onCancel,
}: {
  projects: Project[];
  onInvited: (u: User) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nameError = name.trim().length < 2 ? "Informe o nome." : "";
  const emailError = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Email inválido." : "";

  const toggleProject = (id: string) =>
    setProjectIds((list) => (list.includes(id) ? list.filter((p) => p !== id) : [...list, id]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");
    if (nameError || emailError) return;
    setLoading(true);
    try {
      const created = await api<User>("/users", {
        method: "POST",
        body: { name, email, role, project_ids: role === "editor" ? projectIds : [] },
      });
      onInvited(created);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard strong className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Convidar usuário</h2>
        <button type="button" onClick={onCancel} className="rounded-full p-2 text-ink-soft hover:bg-white hover:text-ink" aria-label="Cancelar">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={submitted ? nameError || undefined : undefined}
            required
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={submitted ? emailError || undefined : undefined}
            required
          />
        </div>

        <SelectField label="Papel" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </SelectField>

        {role === "editor" ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Projetos que ela pode ver</span>
            {projects.length === 0 ? (
              <p className="text-sm text-ink-soft">Nenhum projeto criado ainda.</p>
            ) : (
              <div className="flex flex-col gap-2 rounded-2xl border border-ink/10 bg-white/70 p-3">
                {projects.map((p) => (
                  <label key={p.id} className="flex items-center gap-2.5 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={projectIds.includes(p.id)}
                      onChange={() => toggleProject(p.id)}
                      className="size-4 rounded accent-blue"
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">Admin tem acesso a todos os projetos.</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} icon={<UserPlus className="size-4" aria-hidden />}>
            Enviar convite
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}

function ProjectAccessEditor({ user, projects, onChanged }: { user: User; projects: Project[]; onChanged: (u: User) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleProject = async (id: string) => {
    const nextIds = user.project_ids.includes(id)
      ? user.project_ids.filter((p) => p !== id)
      : [...user.project_ids, id];
    setSaving(true);
    setError("");
    try {
      const updated = await api<User>("/users", { method: "PATCH", body: { id: user.id, role: user.role, project_ids: nextIds } });
      onChanged(updated);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {user.project_ids.length === 0 && <span className="text-xs text-ink-soft">Nenhum projeto ainda</span>}
        {projects
          .filter((p) => user.project_ids.includes(p.id))
          .map((p) => (
            <Badge key={p.id}>{p.name}</Badge>
          ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-blue hover:text-purple"
        >
          Editar acesso
          {open ? <ChevronUp className="size-3.5" aria-hidden /> : <ChevronDown className="size-3.5" aria-hidden />}
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-2 rounded-2xl border border-ink/10 bg-white/70 p-3">
          {error && <Alert tone="error">{error}</Alert>}
          {projects.length === 0 && <p className="text-sm text-ink-soft">Nenhum projeto criado ainda.</p>}
          {projects.map((p) => (
            <label key={p.id} className="flex items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={user.project_ids.includes(p.id)}
                disabled={saving}
                onChange={() => toggleProject(p.id)}
                className="size-4 rounded accent-blue"
              />
              {p.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Users() {
  const { user: me } = useAccount();
  const [users, setUsers] = useState<User[] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    api<User[]>("/users")
      .then(setUsers)
      .catch((e) => setError(errorMessage(e)));
    api<Project[]>("/projects")
      .then(setProjects)
      .catch(() => {});
  }, []);

  const changeRole = async (user: User, role: Role) => {
    if (role === user.role) return;
    const before = users;
    setUsers((list) => list?.map((u) => (u.id === user.id ? { ...u, role, project_ids: role === "admin" ? [] : u.project_ids } : u)) ?? null);
    setSavingId(user.id);
    setError("");
    try {
      const updated = await api<User>("/users", { method: "PATCH", body: { id: user.id, role } });
      setUsers((list) => list?.map((u) => (u.id === user.id ? updated : u)) ?? null);
    } catch (err) {
      setUsers(before);
      setError(errorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const deleteUser = async (user: User) => {
    const before = users;
    setUsers((list) => list?.filter((u) => u.id !== user.id) ?? null);
    setConfirmDeleteId(null);
    setError("");
    try {
      await api(`/users?id=${user.id}`, { method: "DELETE" });
    } catch (err) {
      setUsers(before);
      setError(errorMessage(err));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuários"
        description="Quem acessa este admin e o que cada um pode fazer."
        action={
          !inviting && (
            <Button onClick={() => setInviting(true)} icon={<UserPlus className="size-4" aria-hidden />}>
              Convidar
            </Button>
          )
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      {inviting && (
        <InviteForm
          projects={projects}
          onCancel={() => setInviting(false)}
          onInvited={(u) => {
            setUsers((list) => [...(list ?? []), u]);
            setInviting(false);
          }}
        />
      )}

      {users === null && !error && (
        <div className="flex flex-col gap-3" aria-busy>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="glass h-16 animate-pulse rounded-3xl" />
          ))}
        </div>
      )}

      {users && (
        <GlassCard className="overflow-hidden">
          <ul className="divide-y divide-ink/5">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0 shrink-0">
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    {user.name}
                    {user.id === me.id && <Badge tone="blue">Você</Badge>}
                  </p>
                  <p className="truncate text-sm text-ink-soft">{user.email}</p>
                </div>

                {user.role === "admin" ? (
                  <p className="min-w-0 flex-1 text-sm text-ink-soft">Acesso a todos os projetos</p>
                ) : (
                  <div className="min-w-0 flex-1">
                    <ProjectAccessEditor
                      user={user}
                      projects={projects}
                      onChanged={(updated) => setUsers((list) => list?.map((u) => (u.id === updated.id ? updated : u)) ?? null)}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {user.id === me.id ? (
                    <Badge tone="purple">{ROLE_LABEL[user.role]}</Badge>
                  ) : (
                    <select
                      value={user.role}
                      disabled={savingId === user.id}
                      onChange={(e) => changeRole(user, e.target.value as Role)}
                      className="rounded-full bg-ink/5 px-3.5 py-1.5 text-sm font-semibold text-ink outline-none transition focus:bg-white disabled:opacity-60"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                    </select>
                  )}

                  {user.id !== me.id &&
                    (confirmDeleteId === user.id ? (
                      <div className="flex items-center gap-1.5">
                        <Button variant="danger" onClick={() => deleteUser(user)}>
                          Confirmar?
                        </Button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-full p-2 text-ink-soft hover:bg-white hover:text-ink"
                          aria-label="Cancelar exclusão"
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(user.id)}
                        className="rounded-full p-2 text-ink-soft hover:bg-danger-soft hover:text-danger"
                        aria-label={`Excluir ${user.name}`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}
