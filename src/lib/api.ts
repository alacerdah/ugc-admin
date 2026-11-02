export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// o login vive num cookie httpOnly do mesmo domínio: o navegador manda sozinho, não guardamos token nenhum
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? "GET",
      credentials: "same-origin",
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Sem conexão com o servidor. Confere sua internet e tenta de novo.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? "Algo deu errado. Tenta de novo.");
  return data as T;
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Algo deu errado. Tenta de novo.");
