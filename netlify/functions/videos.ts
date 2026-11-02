import { db } from "../lib/db";
import { HttpError, methodNotAllowed } from "../lib/http";

type Row = {
  niche_id: string;
  niche_name: string;
  niche_position: number;
  id: string | null;
  platform: string | null;
  url: string | null;
  title: string | null;
  tag: string | null;
  position: number | null;
};

// consumido cross-origin pelos templates (ariana.com.br, rihanna.com.br...): toda resposta,
// inclusive erro, precisa do header de CORS — sem ele o template só vê "Failed to fetch",
// nunca a mensagem de erro. Por isso não usa o `handle()` padrão (que não adiciona CORS no catch).
const withCors = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*", ...headers },
  });

export default async function handler(req: Request) {
  try {
    if (req.method !== "GET") throw methodNotAllowed();
    const slug = new URL(req.url).searchParams.get("slug")?.trim().toLowerCase();
    if (!slug) throw new HttpError(400, "Informe o slug do projeto.");

    const project = await db().query<{ id: string }>("select id from projects where slug = $1", [slug]);
    if (!project.rows[0]) throw new HttpError(404, "Projeto não encontrado.");

    const { rows } = await db().query<Row>(
      `select n.id as niche_id, n.name as niche_name, n.position as niche_position,
              v.id, v.platform, v.url, v.title, v.tag, v.position
       from niches n
       left join video_links v on v.niche_id = n.id
       where n.project_id = $1
       order by n.position, v.position`,
      [project.rows[0].id],
    );

    const niches = new Map<string, { id: string; name: string; position: number; videos: unknown[] }>();
    for (const row of rows) {
      if (!niches.has(row.niche_id)) {
        niches.set(row.niche_id, { id: row.niche_id, name: row.niche_name, position: row.niche_position, videos: [] });
      }
      if (row.id) {
        niches.get(row.niche_id)!.videos.push({
          id: row.id,
          platform: row.platform,
          url: row.url,
          title: row.title,
          tag: row.tag,
          position: row.position,
        });
      }
    }

    return withCors({ project: slug, niches: [...niches.values()] }, 200, { "Cache-Control": "public, max-age=60" });
  } catch (e) {
    if (e instanceof HttpError) return withCors({ error: e.message }, e.status);
    console.error(e);
    return withCors({ error: "Erro interno. Tenta de novo em instantes." }, 500);
  }
}

export const config = { path: "/api/videos" };
