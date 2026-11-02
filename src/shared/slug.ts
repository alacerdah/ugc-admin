// endereços que colidem com rotas do próprio admin ou que queremos guardar pra depois
const RESERVED = new Set([
  "app", "api", "admin", "login", "entrar", "cadastro", "cadastrar", "sair", "conta", "configuracoes",
  "usuarios", "projetos", "esqueci-senha", "resetar-senha", "assets", "static", "www",
]);

export function validateSlug(slug: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)) {
    return "O slug precisa ter de 3 a 40 caracteres: letras minúsculas, números e hífen (sem começar ou terminar com hífen).";
  }
  if (slug.includes("--")) return "O slug não pode ter dois hífens seguidos.";
  if (RESERVED.has(slug)) return "Esse slug é reservado. Escolha outro.";
  return null;
}

// "Template Ariana" -> "ariana"
export const suggestSlug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
