import pg from "pg";

let pool: pg.Pool | undefined;

// um pool por instância da function, reaproveitado enquanto ela estiver quente
export function db() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL não configurada");
    const local = /localhost|127\.0\.0\.1/.test(connectionString);
    pool = new pg.Pool({
      connectionString,
      ssl: local ? false : { rejectUnauthorized: false },
      max: Number(process.env.PG_POOL_MAX) || 3,
      idleTimeoutMillis: 30_000,
    });
    // conexão ociosa pode cair a qualquer momento (o Neon encerra as ociosas quando o banco hiberna).
    // sem este listener, o erro vira "Unhandled 'error' event" e derruba a function inteira;
    // com ele, o pool descarta a conexão ruim e abre outra na próxima consulta
    pool.on("error", (err) => console.error("conexão ociosa com o banco caiu:", err.message));
  }
  return pool;
}

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const isUniqueViolation = (e: unknown): e is { code: string; constraint?: string } =>
  (e as { code?: string })?.code === "23505";
