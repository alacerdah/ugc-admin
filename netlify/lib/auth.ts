import jwt from "jsonwebtoken";
import { HttpError } from "./http";

const COOKIE = "ugca_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type Role = "admin" | "editor";
export type Session = { userId: string; role: Role };

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET ausente ou curto demais (mínimo 32 caracteres)");
  return value;
}

// httpOnly: o JavaScript da página não lê o token, então um XSS não consegue roubar a sessão.
// SameSite=Lax: outro site não consegue disparar POST/PATCH/DELETE com o cookie da pessoa.
function cookie(value: string, maxAge: number) {
  const secure = process.env.NETLIFY_DEV === "true" ? "" : "; Secure";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export const sessionCookie = (session: Session) =>
  cookie(jwt.sign(session, secret(), { expiresIn: MAX_AGE_SECONDS }), MAX_AGE_SECONDS);

export const clearedSessionCookie = () => cookie("", 0);

export function requireSession(req: Request): Session {
  const token = (req.headers.get("cookie") ?? "")
    .split(/;\s*/)
    .find((part) => part.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (!token) throw new HttpError(401, "Faça login para continuar.");
  try {
    const payload = jwt.verify(token, secret()) as jwt.JwtPayload & Session;
    return { userId: payload.userId, role: payload.role };
  } catch {
    throw new HttpError(401, "Sua sessão expirou. Faça login de novo.");
  }
}

export function requireAdmin(req: Request): Session {
  const session = requireSession(req);
  if (session.role !== "admin") throw new HttpError(403, "Só administradores podem fazer isso.");
  return session;
}
