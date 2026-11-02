import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import { handle, HttpError, json, methodNotAllowed, readJson } from "../lib/http";

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export default handle(async (req) => {
  if (req.method !== "POST") throw methodNotAllowed();
  const body = await readJson<{ token?: string; password?: string }>(req);
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");
  if (!token) throw new HttpError(400, "Link de redefinição inválido.");
  if (password.length < 8 || password.length > 128) {
    throw new HttpError(400, "A senha precisa ter pelo menos 8 caracteres.");
  }

  const client = await db().connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<{ id: string; user_id: string }>(
      `select id, user_id from password_reset_tokens
       where token_hash = $1 and used_at is null and expires_at > now()
       for update`,
      [hashToken(token)],
    );
    const record = rows[0];
    if (!record) throw new HttpError(400, "Esse link expirou ou já foi usado. Peça um novo.");

    const passwordHash = await bcrypt.hash(password, 10);
    await client.query("update users set password_hash = $1 where id = $2", [passwordHash, record.user_id]);
    await client.query("update password_reset_tokens set used_at = now() where id = $1", [record.id]);
    await client.query("commit");
    return json({ ok: true });
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
});

export const config = { path: "/api/auth/reset-password" };
