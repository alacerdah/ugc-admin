import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import { handle, HttpError, json, methodNotAllowed, readJson } from "../lib/http";
import { sessionCookie } from "../lib/auth";
import { ACCOUNT_SELECT, toAccount, type AccountRow } from "../lib/account";

// hash de uma senha qualquer: quando o email não existe, a comparação roda mesmo assim,
// e o tempo de resposta não entrega quais emails têm conta
const DUMMY_HASH = bcrypt.hashSync("senha-de-conta-que-nao-existe", 10);

export default handle(async (req) => {
  if (req.method !== "POST") throw methodNotAllowed();
  const body = await readJson<{ email?: string; password?: string }>(req);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const { rows } = await db().query<AccountRow & { password_hash: string }>(
    `${ACCOUNT_SELECT.replace("select id,", "select password_hash, id,")} where email = $1`,
    [email],
  );
  const row = rows[0];
  const valid = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !valid) throw new HttpError(401, "Email ou senha incorretos.");

  const account = toAccount(row);
  return json(account, 200, {
    "Set-Cookie": sessionCookie({ userId: account.user.id, role: account.user.role }),
  });
});

export const config = { path: "/api/auth/login" };
