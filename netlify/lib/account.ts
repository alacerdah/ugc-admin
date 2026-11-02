import type { Role } from "./auth";

// formato único de "quem está logado", usado por cadastro, login e /api/me
export type AccountRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export const ACCOUNT_SELECT = "select id, email, name, role from users";

export const toAccount = (row: AccountRow) => ({
  user: { id: row.id, email: row.email, name: row.name, role: row.role },
});
