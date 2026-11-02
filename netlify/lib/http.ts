import type { Context } from "@netlify/functions";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

// erro esperado vira resposta com a mensagem; erro inesperado vira 500 genérico e vai pro log
export const handle =
  (fn: (req: Request, context: Context) => Promise<Response>) => async (req: Request, context: Context) => {
    try {
      return await fn(req, context);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: "Erro interno. Tenta de novo em instantes." }, 500);
    }
  };

export async function readJson<T>(req: Request): Promise<T> {
  try {
    const body = await req.json();
    if (body && typeof body === "object") return body as T;
  } catch {
    // cai no erro abaixo
  }
  throw new HttpError(400, "Corpo da requisição inválido.");
}

export const methodNotAllowed = () => new HttpError(405, "Método não permitido.");
