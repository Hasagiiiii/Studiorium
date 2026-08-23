-- Studiorium v3.6 — fundação do grafo social do Lorion.
-- Migração aditiva: cria relações de seguir sem alterar dados existentes.

begin;

create table if not exists public.user_follows (
  follower_id text not null references public.users(id) on delete cascade,
  followed_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint user_follows_no_self check (follower_id <> followed_id)
);

create index if not exists user_follows_followed_created_idx
  on public.user_follows(followed_id, created_at desc);
create index if not exists user_follows_follower_created_idx
  on public.user_follows(follower_id, created_at desc);

alter table public.user_follows enable row level security;

-- O navegador não acessa o grafo diretamente. Toda leitura/escrita passa pela API do Studiorium,
-- que autentica a sessão e aplica as regras sociais no servidor.
revoke all on table public.user_follows from public, anon, authenticated;
grant select, insert, update, delete on table public.user_follows to service_role;

insert into public.studiorium_schema_migrations (migration_id, description)
values ('v3.6-social-graph', 'Grafo social inicial do Lorion com relações de seguir')
on conflict (migration_id) do update set description = excluded.description;

commit;
