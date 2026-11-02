import { db, isUuid } from "../lib/db";
import { handle, HttpError, json, methodNotAllowed, readJson } from "../lib/http";
import { requireSession } from "../lib/auth";

const COLUMNS = "id, project_id, name, position, created_at";

export default handle(async (req) => {
  requireSession(req);
  const params = new URL(req.url).searchParams;

  if (req.method === "GET") {
    const projectId = params.get("project_id");
    if (!isUuid(projectId)) throw new HttpError(400, "Projeto inválido.");
    const { rows } = await db().query(`select ${COLUMNS} from niches where project_id = $1 order by position, created_at`, [
      projectId,
    ]);
    return json(rows);
  }

  if (req.method === "POST") {
    const body = await readJson<{ project_id?: string; name?: string }>(req);
    if (!isUuid(body.project_id)) throw new HttpError(400, "Projeto inválido.");
    const name = String(body.name ?? "").trim();
    if (name.length < 1 || name.length > 60) throw new HttpError(400, "Informe o nome do nicho (até 60 caracteres).");

    const { rows } = await db().query(
      `insert into niches (project_id, name, position)
       values ($1, $2, coalesce((select max(position) + 1 from niches where project_id = $1), 0))
       returning ${COLUMNS}`,
      [body.project_id, name],
    );
    return json(rows[0], 201);
  }

  // renomear um nicho
  if (req.method === "PATCH") {
    const body = await readJson<{ id?: string; name?: string }>(req);
    if (!isUuid(body.id)) throw new HttpError(400, "Nicho inválido.");
    const name = String(body.name ?? "").trim();
    if (name.length < 1 || name.length > 60) throw new HttpError(400, "Informe o nome do nicho (até 60 caracteres).");

    const { rows } = await db().query(`update niches set name = $1 where id = $2 returning ${COLUMNS}`, [name, body.id]);
    if (!rows[0]) throw new HttpError(404, "Nicho não encontrado.");
    return json(rows[0]);
  }

  // salvar a nova ordem dos nichos depois de arrastar
  if (req.method === "PUT") {
    const body = await readJson<{ project_id?: string; ids?: unknown }>(req);
    if (!isUuid(body.project_id) || !Array.isArray(body.ids) || !body.ids.every(isUuid)) {
      throw new HttpError(400, "Ordem inválida.");
    }
    await db().query(
      `update niches n set position = o.ord - 1
       from unnest($2::uuid[]) with ordinality as o(id, ord)
       where n.id = o.id and n.project_id = $1`,
      [body.project_id, body.ids],
    );
    return json({ ok: true });
  }

  if (req.method === "DELETE") {
    const id = params.get("id");
    if (!isUuid(id)) throw new HttpError(400, "Nicho inválido.");
    const { rowCount } = await db().query("delete from niches where id = $1", [id]);
    if (!rowCount) throw new HttpError(404, "Nicho não encontrado.");
    return json({ ok: true });
  }

  throw methodNotAllowed();
});

export const config = { path: "/api/niches" };
