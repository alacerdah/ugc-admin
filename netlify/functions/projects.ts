import { db, isUniqueViolation, isUuid } from "../lib/db";
import { handle, HttpError, json, methodNotAllowed, readJson } from "../lib/http";
import { requireAdmin, requireSession } from "../lib/auth";
import { validateSlug } from "../../src/shared/slug";

const COLUMNS = "id, name, slug, domain, repo_name, contact_email, created_at";

export default handle(async (req) => {
  requireSession(req); // qualquer pessoa logada pode ver os projetos
  const params = new URL(req.url).searchParams;

  if (req.method === "GET") {
    const id = params.get("id");
    if (id) {
      if (!isUuid(id)) throw new HttpError(400, "Projeto inválido.");
      const { rows } = await db().query(`select ${COLUMNS} from projects where id = $1`, [id]);
      if (!rows[0]) throw new HttpError(404, "Projeto não encontrado.");
      return json(rows[0]);
    }
    const { rows } = await db().query(
      `select p.${COLUMNS.replace(/, /g, ", p.")},
         (select count(*) from niches n where n.project_id = p.id) as niche_count,
         (select count(*) from video_links vl join niches n on n.id = vl.niche_id where n.project_id = p.id) as link_count
       from projects p order by p.created_at`,
    );
    return json(rows);
  }

  // criar/editar projeto e trocar o email de contato é coisa de admin
  requireAdmin(req);

  if (req.method === "POST") {
    const body = await readJson<{ name?: string; slug?: string; domain?: string; repo_name?: string; contact_email?: string }>(req);
    const name = String(body.name ?? "").trim();
    const slug = String(body.slug ?? "").trim().toLowerCase();
    if (name.length < 2 || name.length > 80) throw new HttpError(400, "Informe o nome do projeto.");
    const slugError = validateSlug(slug);
    if (slugError) throw new HttpError(400, slugError);

    try {
      const { rows } = await db().query(
        `insert into projects (name, slug, domain, repo_name, contact_email)
         values ($1, $2, $3, $4, $5) returning ${COLUMNS}`,
        [name, slug, String(body.domain ?? "").trim(), String(body.repo_name ?? "").trim(), String(body.contact_email ?? "").trim()],
      );
      return json(rows[0], 201);
    } catch (e) {
      if (isUniqueViolation(e)) throw new HttpError(409, "Esse slug já está em uso. Escolha outro.");
      throw e;
    }
  }

  // config do projeto: nome, domínio, repo, email de contato. O slug não muda depois de criado —
  // é a chave pública que os templates já têm configurada, trocar quebraria o endpoint deles.
  if (req.method === "PATCH") {
    const body = await readJson<{ id?: string; name?: string; domain?: string; repo_name?: string; contact_email?: string }>(req);
    if (!isUuid(body.id)) throw new HttpError(400, "Projeto inválido.");
    const name = String(body.name ?? "").trim();
    if (name.length < 2 || name.length > 80) throw new HttpError(400, "Informe o nome do projeto.");

    const { rows } = await db().query(
      `update projects set name = $1, domain = $2, repo_name = $3, contact_email = $4 where id = $5 returning ${COLUMNS}`,
      [name, String(body.domain ?? "").trim(), String(body.repo_name ?? "").trim(), String(body.contact_email ?? "").trim(), body.id],
    );
    if (!rows[0]) throw new HttpError(404, "Projeto não encontrado.");
    return json(rows[0]);
  }

  if (req.method === "DELETE") {
    const id = params.get("id");
    if (!isUuid(id)) throw new HttpError(400, "Projeto inválido.");
    const { rowCount } = await db().query("delete from projects where id = $1", [id]);
    if (!rowCount) throw new HttpError(404, "Projeto não encontrado.");
    return json({ ok: true });
  }

  throw methodNotAllowed();
});

export const config = { path: "/api/projects" };
