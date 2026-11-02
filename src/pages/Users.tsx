import { useEffect, useState } from "react";
import { useAccount } from "../auth/AuthProvider";
import { api, errorMessage } from "../lib/api";
import type { Role, User } from "../lib/types";
import { Alert, Badge, GlassCard, PageHeader } from "../components/ui";

const ROLE_LABEL: Record<Role, string> = { admin: "Admin", editor: "Editor" };

export default function Users() {
  const { user: me } = useAccount();
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    api<User[]>("/users")
      .then(setUsers)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const changeRole = async (user: User, role: Role) => {
    if (role === user.role) return;
    const before = users;
    setUsers((list) => list?.map((u) => (u.id === user.id ? { ...u, role } : u)) ?? null);
    setSavingId(user.id);
    setError("");
    try {
      await api<User>("/users", { method: "PATCH", body: { id: user.id, role } });
    } catch (err) {
      setUsers(before);
      setError(errorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Usuários" description="Quem acessa este admin e o que cada um pode fazer." />

      {error && <Alert tone="error">{error}</Alert>}

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
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    {user.name}
                    {user.id === me.id && <Badge tone="blue">Você</Badge>}
                  </p>
                  <p className="truncate text-sm text-ink-soft">{user.email}</p>
                </div>

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
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}
