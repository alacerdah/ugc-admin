import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db, isUniqueViolation, isUuid } from "../lib/db";
import { handle, HttpError, json, methodNotAllowed, readJson } from "../lib/http";
import { requireAdmin } from "../lib/auth";
import { sendInviteEmail } from "../lib/mailer";

const COLUMNS = "id, email, name, role, created_at";
const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

type Role = "admin" | "editor";
const isRole = (v: unknown): v is Role => v === "admin" || v === "editor";

async function projectIdsOf(userId: string) {
  const { rows } = await db().query<{ project_id: string }>("select project_id from project_access where user_id = $1", [
    userId,
  ]);
  return rows.map((r) => r.project_id);
}

// mantém só os ids que de fato existem em `projects` — ignora o resto em silêncio
async function existingProjectIds(ids: unknown): Promise<string[]> {
  if (!Array.isArray(ids)) return [];
  const uuids = ids.filter(isUuid);
  if (uuids.length === 0) return [];
  const { rows } = await db().query<{ id: string }>("select id from projects where id = any($1::uuid[])", [uuids]);
  return rows.map((r) => r.id);
}

async function replaceProjectAccess(userId: string, projectIds: string[]) {
  const client = await db().connect();
  try {
    await client.query("begin");
    await client.query("delete from project_access where user_id = $1", [userId]);
    for (const projectId of projectIds) {
      await client.query("insert into project_access (user_id, project_id) values ($1, $2)", [userId, projectId]);
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

export default handle(async (req) => {
  const session = requireAdmin(req);
  const params = new URL(req.url).searchParams;

  if (req.method === "GET") {
    const { rows } = await db().query(`select ${COLUMNS} from users order by created_at`);
    const withAccess = await Promise.all(
      rows.map(async (u: { id: string; role: Role }) => ({
        ...u,
        project_ids: u.role === "admin" ? [] : await projectIdsOf(u.id),
      })),
    );
    return json(withAccess);
  }

  // convidar alguém por email — cria a conta já com papel e projetos definidos, sem
  // a pessoa ter se cadastrado. Senha fica inutilizável (aleatória, ninguém a conhece)
  // até ela clicar no link do email e definir a própria, reaproveitando o fluxo de reset.
  if (req.method === "POST") {
    const body = await readJson<{ name?: string; email?: string; role?: string; project_ids?: unknown }>(req);
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (name.length < 2 || name.length > 80) throw new HttpError(400, "Informe o nome (2 a 80 caracteres).");
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Email inválido.");
    if (!isRole(body.role)) throw new HttpError(400, "Papel inválido.");

    const projectIds = body.role === "editor" ? await existingProjectIds(body.project_ids) : [];
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    let userId: string;
    try {
      const { rows } = await db().query<{ id: string }>(
        "insert into users (email, password_hash, name, role) values ($1, $2, $3, $4) returning id",
        [email, passwordHash, name, body.role],
      );
      userId = rows[0].id;
    } catch (e) {
      if (isUniqueViolation(e)) throw new HttpError(409, "Já existe uma conta com esse email.");
      throw e;
    }

    if (projectIds.length > 0) await replaceProjectAccess(userId, projectIds);

    const token = crypto.randomBytes(32).toString("hex");
    await db().query(
      "insert into password_reset_tokens (user_id, token_hash, expires_at) values ($1, $2, now() + interval '1 hour')",
      [userId, hashToken(token)],
    );
    const setUrl = `${process.env.APP_URL || "http://localhost:8888"}/resetar-senha?token=${token}`;
    try {
      await sendInviteEmail(email, name, setUrl);
    } catch (e) {
      console.error("falha ao enviar email de convite:", e);
    }

    return json({ id: userId, email, name, role: body.role, project_ids: projectIds }, 201);
  }

  // trocar o papel e/ou os projetos de outro usuário
  if (req.method === "PATCH") {
    const body = await readJson<{ id?: string; role?: string; project_ids?: unknown }>(req);
    if (!isUuid(body.id)) throw new HttpError(400, "Usuário inválido.");
    if (!isRole(body.role)) throw new HttpError(400, "Papel inválido.");
    if (body.id === session.userId) throw new HttpError(400, "Você não pode trocar seu próprio papel.");

    const { rows } = await db().query(`update users set role = $1 where id = $2 returning ${COLUMNS}`, [
      body.role,
      body.id,
    ]);
    if (!rows[0]) throw new HttpError(404, "Usuário não encontrado.");

    let projectIds = await projectIdsOf(body.id);
    if (body.role === "admin") {
      if (projectIds.length > 0) await replaceProjectAccess(body.id, []);
      projectIds = [];
    } else if (body.project_ids !== undefined) {
      projectIds = await existingProjectIds(body.project_ids);
      await replaceProjectAccess(body.id, projectIds);
    }

    return json({ ...rows[0], project_ids: projectIds });
  }

  if (req.method === "DELETE") {
    const id = params.get("id");
    if (!isUuid(id)) throw new HttpError(400, "Usuário inválido.");
    if (id === session.userId) throw new HttpError(400, "Você não pode excluir sua própria conta.");
    const { rowCount } = await db().query("delete from users where id = $1", [id]);
    if (!rowCount) throw new HttpError(404, "Usuário não encontrado.");
    return json({ ok: true });
  }

  throw methodNotAllowed();
});

export const config = { path: "/api/users" };
