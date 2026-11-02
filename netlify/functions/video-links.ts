import { db, isUuid } from "../lib/db";
import { handle, HttpError, json, methodNotAllowed, readJson } from "../lib/http";
import { requireSession } from "../lib/auth";
import { isPlatform } from "../../src/shared/platforms";

const COLUMNS = "id, niche_id, platform, url, title, tag, position, created_at";

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
  requireSession(req);
  const params = new URL(req.url).searchParams;

  if (req.method === "GET") {
    const nicheId = params.get("niche_id");
    if (!isUuid(nicheId)) throw new HttpError(400, "Nicho inválido.");
    const { rows } = await db().query(
      `select ${COLUMNS} from video_links where niche_id = $1 order by position, created_at`,
      [nicheId],
    );
    return json(rows);
  }

  if (req.method === "POST") {
    const body = await readJson<{ niche_id?: string; platform?: string; url?: string; title?: string; tag?: string }>(req);
    if (!isUuid(body.niche_id)) throw new HttpError(400, "Nicho inválido.");
    if (!isPlatform(body.platform)) throw new HttpError(400, "Plataforma inválida.");
    const url = validateUrl(String(body.url ?? ""));
    const title = String(body.title ?? "").trim();
    const tag = String(body.tag ?? "").trim();
    if (title.length > 80) throw new HttpError(400, "O título pode ter até 80 caracteres.");
    if (tag.length > 20) throw new HttpError(400, "A tag pode ter até 20 caracteres.");

    const { rows } = await db().query(
      `insert into video_links (niche_id, platform, url, title, tag, position)
       values ($1, $2, $3, $4, $5, coalesce((select max(position) + 1 from video_links where niche_id = $1), 0))
       returning ${COLUMNS}`,
      [body.niche_id, body.platform, url, title, tag],
    );
    return json(rows[0], 201);
  }

  // editar um link existente
  if (req.method === "PATCH") {
    const body = await readJson<{ id?: string; platform?: string; url?: string; title?: string; tag?: string }>(req);
    if (!isUuid(body.id)) throw new HttpError(400, "Link inválido.");
    if (!isPlatform(body.platform)) throw new HttpError(400, "Plataforma inválida.");
    const url = validateUrl(String(body.url ?? ""));
    const title = String(body.title ?? "").trim();
    const tag = String(body.tag ?? "").trim();
    if (title.length > 80) throw new HttpError(400, "O título pode ter até 80 caracteres.");
    if (tag.length > 20) throw new HttpError(400, "A tag pode ter até 20 caracteres.");

    const { rows } = await db().query(
      `update video_links set platform = $1, url = $2, title = $3, tag = $4 where id = $5 returning ${COLUMNS}`,
      [body.platform, url, title, tag, body.id],
    );
    if (!rows[0]) throw new HttpError(404, "Link não encontrado.");
    return json(rows[0]);
  }

  // salvar a nova ordem depois de arrastar
  if (req.method === "PUT") {
    const body = await readJson<{ niche_id?: string; ids?: unknown }>(req);
    if (!isUuid(body.niche_id) || !Array.isArray(body.ids) || !body.ids.every(isUuid)) {
      throw new HttpError(400, "Ordem inválida.");
    }
    await db().query(
      `update video_links v set position = o.ord - 1
       from unnest($2::uuid[]) with ordinality as o(id, ord)
       where v.id = o.id and v.niche_id = $1`,
      [body.niche_id, body.ids],
    );
    return json({ ok: true });
  }

  if (req.method === "DELETE") {
    const id = params.get("id");
    if (!isUuid(id)) throw new HttpError(400, "Link inválido.");
    const { rowCount } = await db().query("delete from video_links where id = $1", [id]);
    if (!rowCount) throw new HttpError(404, "Link não encontrado.");
    return json({ ok: true });
  }

  throw methodNotAllowed();
});

export const config = { path: "/api/video-links" };
