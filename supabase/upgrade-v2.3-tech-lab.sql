-- Studiorium v2.3 — Tecnologia, Oficina e Laboratório de Código
create table if not exists public.tech_resources (
 id text primary key, owner_id text not null references public.users(id) on delete cascade, author_name text not null,
 title text not null, slug text not null unique, summary text not null default '', body text not null default '',
 hub text not null default 'Tecnologia', category text not null default 'Tutorial', tags text[] not null default '{}',
 status text not null default 'pending_review' check(status in ('pending_review','published','rejected','hidden')),
 featured boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists tech_resources_hub_idx on public.tech_resources(hub,status,created_at desc);
create table if not exists public.code_projects (
  id text primary key,
  owner_id text not null references public.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  html text not null default '',
  css text not null default '',
  javascript text not null default '',
  visibility text not null default 'private' check(visibility in ('private','public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists code_projects_owner_idx on public.code_projects(owner_id,updated_at desc);
alter table public.tech_resources enable row level security;
alter table public.code_projects enable row level security;
grant all on table public.tech_resources, public.code_projects to service_role;
