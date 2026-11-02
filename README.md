# ugc-admin

Admin central dos projetos UGC (Ariana, Rihanna, Loren Martins, etc.). Cada projeto tem nichos, e cada nicho tem uma lista ordenável de links de vídeo. Os templates (sites das criadoras) consomem `GET /api/videos?slug=<project-slug>` pra buscar esses links sem precisar de novo deploy.

Plano completo em `C:\Users\Anna Lacerda\.claude\plans\velvet-gathering-taco.md`.

## Rodar localmente

```bash
npm install
netlify dev
```

Antes disso, rode `db/schema.sql` num Neon novo e copie `.env.example` para `.env` com os valores reais.

## Estrutura

- `netlify/functions/*` — API (Netlify Functions, uma por arquivo, `config.path` define a rota em `/api/...`)
- `netlify/lib/*` — db, auth (cookie JWT), http, email, compartilhados entre as functions
- `src/*` — SPA React (login, dashboard de projetos, nichos e links, usuários)
