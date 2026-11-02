import { handle, json, methodNotAllowed } from "../lib/http";
import { clearedSessionCookie } from "../lib/auth";

export default handle(async (req) => {
  if (req.method !== "POST") throw methodNotAllowed();
  return json({ ok: true }, 200, { "Set-Cookie": clearedSessionCookie() });
});

export const config = { path: "/api/auth/logout" };
