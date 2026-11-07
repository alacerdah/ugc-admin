import { db, isUuid } from "../lib/db";
import { handle, HttpError, json, methodNotAllowed, readJson } from "../lib/http";
import { requireSession } from "../lib/auth";
import { assertProjectAccess } from "../lib/access";

const COLUMNS = "id, project_id, platform, url, title, tag, position, created_at";

type GalleryPlatform = "instagram" | "tiktok" | "canva";
const isGalleryPlatform = (v: unknown): v is GalleryPlatform => v === "instagram" || v === "tiktok" || v === "canva";

async function projectIdOfPhoto(id: string) {
  const { rows } = await db().query<{ project_id: string }>("select project_id from gallery_photos where id = $1", [id]);
  if (!rows[0]) throw new HttpError(404, "Foto não encontrada.");
  return rows[0].project_id;
}

function validateUrl(raw: string) {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new HttpError(400, "Informe um link válido (https://...).");
  }
}

export default handle(async (req) => {
  const session = requireSession(req);
  const params = new URL(req.url).searchParams;

  if (req.method === "GET") {
    const projectId = params.get("project_id");
    if (!isUuid(projectId)) throw new HttpError(400, "Projeto inválido.");
    await assertProjectAccess(session, projectId);
    const { rows } = await db().query(
      `select ${COLUMNS} from gallery_photos where project_id = $1 order by position, created_at`,
      [projectId],
    );
    return json(rows);
  }

  if (req.method === "POST") {
    const body = await readJson<{ project_id?: string; platform?: string; url?: string; title?: string; tag?: string }>(req);
    if (!isUuid(body.project_id)) throw new HttpError(400, "Projeto inválido.");
    await assertProjectAccess(session, body.project_id);
    if (!isGalleryPlatform(body.platform)) throw new HttpError(400, "Plataforma inválida.");
    const url = validateUrl(String(body.url ?? ""));
    const title = String(body.title ?? "").trim();
    const tag = String(body.tag ?? "").trim();
    if (title.length > 80) throw new HttpError(400, "O título pode ter até 80 caracteres.");
    if (tag.length > 20) throw new HttpError(400, "A tag pode ter até 20 caracteres.");

    const { rows } = await db().query(
      `insert into gallery_photos (project_id, platform, url, title, tag, position)
       values ($1, $2, $3, $4, $5, coalesce((select max(position) + 1 from gallery_photos where project_id = $1), 0))
       returning ${COLUMNS}`,
      [body.project_id, body.platform, url, title, tag],
    );
    return json(rows[0], 201);
  }

  // editar uma foto existente
  if (req.method === "PATCH") {
    const body = await readJson<{ id?: string; platform?: string; url?: string; title?: string; tag?: string }>(req);
    if (!isUuid(body.id)) throw new HttpError(400, "Foto inválida.");
    await assertProjectAccess(session, await projectIdOfPhoto(body.id));
    if (!isGalleryPlatform(body.platform)) throw new HttpError(400, "Plataforma inválida.");
    const url = validateUrl(String(body.url ?? ""));
    const title = String(body.title ?? "").trim();
    const tag = String(body.tag ?? "").trim();
    if (title.length > 80) throw new HttpError(400, "O título pode ter até 80 caracteres.");
    if (tag.length > 20) throw new HttpError(400, "A tag pode ter até 20 caracteres.");

    const { rows } = await db().query(
      `update gallery_photos set platform = $1, url = $2, title = $3, tag = $4 where id = $5 returning ${COLUMNS}`,
      [body.platform, url, title, tag, body.id],
    );
    if (!rows[0]) throw new HttpError(404, "Foto não encontrada.");
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
      `update gallery_photos g set position = o.ord - 1
       from unnest($2::uuid[]) with ordinality as o(id, ord)
       where g.id = o.id and g.project_id = $1`,
      [body.project_id, body.ids],
    );
    return json({ ok: true });
  }

  if (req.method === "DELETE") {
    const id = params.get("id");
    if (!isUuid(id)) throw new HttpError(400, "Foto inválida.");
    await assertProjectAccess(session, await projectIdOfPhoto(id));
    const { rowCount } = await db().query("delete from gallery_photos where id = $1", [id]);
    if (!rowCount) throw new HttpError(404, "Foto não encontrada.");
    return json({ ok: true });
  }

  throw methodNotAllowed();
});

export const config = { path: "/api/gallery-photos" };
