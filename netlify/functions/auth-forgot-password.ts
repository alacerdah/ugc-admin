import crypto from "node:crypto";
import { db } from "../lib/db";
import { handle, json, methodNotAllowed, readJson } from "../lib/http";
import { sendPasswordResetEmail } from "../lib/mailer";

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export default handle(async (req) => {
  if (req.method !== "POST") throw methodNotAllowed();
  const body = await readJson<{ email?: string }>(req);
  const email = String(body.email ?? "").trim().toLowerCase();

  // mesma resposta exista ou não o email: não revela quais contas existem
  const respond = () => json({ ok: true });

  const { rows } = await db().query<{ id: string }>("select id from users where email = $1", [email]);
  const user = rows[0];
  if (!user) return respond();

  const token = crypto.randomBytes(32).toString("hex");
  await db().query(
    "insert into password_reset_tokens (user_id, token_hash, expires_at) values ($1, $2, now() + interval '1 hour')",
    [user.id, hashToken(token)],
  );

  const resetUrl = `${process.env.APP_URL || "http://localhost:8888"}/resetar-senha?token=${token}`;
  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (e) {
    console.error("falha ao enviar email de reset de senha:", e);
  }
  return respond();
});

export const config = { path: "/api/auth/forgot-password" };
