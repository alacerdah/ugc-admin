import { db, isUuid } from "../lib/db";
import { handle, HttpError, json, methodNotAllowed, readJson } from "../lib/http";
import { requireSession } from "../lib/auth";
import { assertProjectAccess } from "../lib/access";

const COLUMNS = "id, project_id, instagram_url, canva_url, title, position, created_at";

function validateUrl(raw: string) {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new HttpError(400, "Informe um link válido (https://...).");
  }
}

async function projectIdOfPost(id: string) {
  const { rows } = await db().query<{ project_id: string }>("select project_id from carousel_posts where id = $1", [id]);
  if (!rows[0]) throw new HttpError(404, "Post não encontrado.");
  return rows[0].project_id;
}

export default handle(async (req) => {
  const session = requireSession(req);
  const params = new URL(req.url).searchParams;

  if (req.method === "GET") {
    const projectId = params.get("project_id");
    if (!isUuid(projectId)) throw new HttpError(400, "Projeto inválido.");
    await assertProjectAccess(session, projectId);
    const { rows } = await db().query(
      `select ${COLUMNS} from carousel_posts where project_id = $1 order by position, created_at`,
      [projectId],
    );
    return json(rows);
  }

  if (req.method === "POST") {
    const body = await readJson<{ project_id?: string; instagram_url?: string; canva_url?: string; title?: string }>(req);
    if (!isUuid(body.project_id)) throw new HttpError(400, "Projeto inválido.");
    await assertProjectAccess(session, body.project_id);
    const instagramUrl = validateUrl(String(body.instagram_url ?? ""));
    const canvaRaw = String(body.canva_url ?? "").trim();
    const canvaUrl = canvaRaw ? validateUrl(canvaRaw) : null;
    const title = String(body.title ?? "").trim();
    if (title.length > 80) throw new HttpError(400, "O título pode ter até 80 caracteres.");

    const { rows } = await db().query(
      `insert into carousel_posts (project_id, instagram_url, canva_url, title, position)
       values ($1, $2, $3, $4, coalesce((select max(position) + 1 from carousel_posts where project_id = $1), 0))
       returning ${COLUMNS}`,
      [body.project_id, instagramUrl, canvaUrl, title],
    );
    return json(rows[0], 201);
  }

  // editar um post existente
  if (req.method === "PATCH") {
    const body = await readJson<{ id?: string; instagram_url?: string; canva_url?: string; title?: string }>(req);
    if (!isUuid(body.id)) throw new HttpError(400, "Post inválido.");
    await assertProjectAccess(session, await projectIdOfPost(body.id));
    const instagramUrl = validateUrl(String(body.instagram_url ?? ""));
    const canvaRaw = String(body.canva_url ?? "").trim();
    const canvaUrl = canvaRaw ? validateUrl(canvaRaw) : null;
    const title = String(body.title ?? "").trim();
    if (title.length > 80) throw new HttpError(400, "O título pode ter até 80 caracteres.");

    const { rows } = await db().query(
      `update carousel_posts set instagram_url = $1, canva_url = $2, title = $3 where id = $4 returning ${COLUMNS}`,
      [instagramUrl, canvaUrl, title, body.id],
    );
    if (!rows[0]) throw new HttpError(404, "Post não encontrado.");
    return json(rows[0]);
  }

  // salvar a nova ordem depois de arrastar
  if (req.method === "PUT") {
    const body = await readJson<{ project_id?: string; ids?: unknown }>(req);
    if (!isUuid(body.project_id) || !Array.isArray(body.ids) || !body.ids.every(isUuid)) {
      throw new HttpError(400, "Ordem inválida.");
    }
    await assertProjectAccess(session, body.project_id);
    await db().query(
      `update carousel_posts c set position = o.ord - 1
       from unnest($2::uuid[]) with ordinality as o(id, ord)
       where c.id = o.id and c.project_id = $1`,
      [body.project_id, body.ids],
    );
    return json({ ok: true });
  }

  if (req.method === "DELETE") {
    const id = params.get("id");
    if (!isUuid(id)) throw new HttpError(400, "Post inválido.");
    await assertProjectAccess(session, await projectIdOfPost(id));
    const { rowCount } = await db().query("delete from carousel_posts where id = $1", [id]);
    if (!rowCount) throw new HttpError(404, "Post não encontrado.");
    return json({ ok: true });
  }

  throw methodNotAllowed();
});

export const config = { path: "/api/carousel-posts" };
