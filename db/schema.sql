-- Rodar no SQL Editor do Neon. Idempotente: pode rodar de novo.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  role text not null default 'admin' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_reset_tokens_user_idx on password_reset_tokens (user_id);

-- cada site/template de criadora (template-ariana, template-rihanna...) é um projeto
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'), -- identificador público, usado pelo endpoint de vídeos
  domain text not null default '',      -- referência (ex: ariana.com.br), não é a chave
  repo_name text not null default '',   -- referência (ex: template-ariana), só anotação
  contact_email text not null default '', -- destino dos leads do formulário de contato daquele site
  created_at timestamptz not null default now()
);

create table if not exists niches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists niches_listing_idx on niches (project_id, position);

create table if not exists video_links (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid not null references niches(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok', 'youtube', 'outro')),
  url text not null,
  title text not null default '',
  tag text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists video_links_listing_idx on video_links (niche_id, position);
