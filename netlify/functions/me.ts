import { db } from "../lib/db";
import { handle, HttpError, json, methodNotAllowed } from "../lib/http";
import { requireSession } from "../lib/auth";
import { ACCOUNT_SELECT, toAccount, type AccountRow } from "../lib/account";

export default handle(async (req) => {
  if (req.method !== "GET") throw methodNotAllowed();
  const session = requireSession(req);
  const { rows } = await db().query<AccountRow>(`${ACCOUNT_SELECT} where id = $1`, [session.userId]);
  if (!rows[0]) throw new HttpError(401, "Sua conta não foi encontrada. Faça login de novo.");
  return json(toAccount(rows[0]));
});

export const config = { path: "/api/me" };
