import { db } from "./db";
import { HttpError } from "./http";
import type { Session } from "./auth";

// admin vê tudo sempre; editor só os projetos em project_access. 404 (não 403) pra não
// revelar a um editor que um projeto que ele não acessa existe.
export async function assertProjectAccess(session: Session, projectId: string) {
  if (session.role === "admin") return;
  const { rows } = await db().query("select 1 from project_access where user_id = $1 and project_id = $2", [
    session.userId,
    projectId,
  ]);
  if (!rows[0]) throw new HttpError(404, "Projeto não encontrado.");
}
