import bcrypt from "bcryptjs";
import { db, isUniqueViolation } from "../lib/db";
import { handle, HttpError, json, methodNotAllowed, readJson } from "../lib/http";
import { sessionCookie } from "../lib/auth";
import { toAccount } from "../lib/account";

type Body = { name?: string; email?: string; password?: string };

// v1: cadastro aberto (só a Anna usa por enquanto). Se a equipe crescer, trocar por
// convite feito por um admin em /app/usuarios, em vez de deixar qualquer um se cadastrar.
export default handle(async (req) => {
  if (req.method !== "POST") throw methodNotAllowed();
  const body = await readJson<Body>(req);
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (name.length < 2 || name.length > 80) throw new HttpError(400, "Informe seu nome (2 a 80 caracteres).");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Email inválido.");
  if (password.length < 8 || password.length > 128) {
    throw new HttpError(400, "A senha precisa ter pelo menos 8 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    // primeiro usuário cadastrado vira admin; os demais entram como editor
    const { rows: countRows } = await db().query<{ count: string }>("select count(*)::text as count from users");
    const role = countRows[0].count === "0" ? "admin" : "editor";

    const { rows } = await db().query<{ id: string }>(
      "insert into users (email, password_hash, name, role) values ($1, $2, $3, $4) returning id",
      [email, passwordHash, name, role],
    );

    const account = toAccount({ id: rows[0].id, email, name, role });
    return json(account, 201, {
      "Set-Cookie": sessionCookie({ userId: account.user.id, role: account.user.role }),
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw new HttpError(409, "Já existe uma conta com esse email.");
    throw e;
  }
});

export const config = { path: "/api/auth/register" };
