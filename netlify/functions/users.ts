import { db, isUuid } from "../lib/db";
import { handle, HttpError, json, methodNotAllowed, readJson } from "../lib/http";
import { requireAdmin } from "../lib/auth";

const COLUMNS = "id, email, name, role, created_at";

export default handle(async (req) => {
  const session = requireAdmin(req);

  if (req.method === "GET") {
    const { rows } = await db().query(`select ${COLUMNS} from users order by created_at`);
    return json(rows);
  }

  // trocar o papel de outro usuário
  if (req.method === "PATCH") {
    const body = await readJson<{ id?: string; role?: string }>(req);
    if (!isUuid(body.id)) throw new HttpError(400, "Usuário inválido.");
    if (body.role !== "admin" && body.role !== "editor") throw new HttpError(400, "Papel inválido.");
    if (body.id === session.userId) throw new HttpError(400, "Você não pode trocar seu próprio papel.");

    const { rows } = await db().query(`update users set role = $1 where id = $2 returning ${COLUMNS}`, [
      body.role,
      body.id,
    ]);
    if (!rows[0]) throw new HttpError(404, "Usuário não encontrado.");
    return json(rows[0]);
  }

  throw methodNotAllowed();
});

export const config = { path: "/api/users" };
