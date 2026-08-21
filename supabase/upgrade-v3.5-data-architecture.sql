-- Studiorium v3.5 — fundação profissional de arquitetura de dados.
-- Migração aditiva e retrocompatível: nenhum ID existente é reescrito e users.role continua
-- disponível durante a transição para RBAC.

begin;

-- Histórico explícito das evoluções de schema feitas pelo Studiorium.
create table if not exists public.studiorium_schema_migrations (
  migration_id text primary key,
  description text not null,
  applied_at timestamptz not null default now()
);

-- RBAC global: cargos e permissões deixam de depender exclusivamente de users.role.
create table if not exists public.roles (
  id text primary key,
  name text not null unique,
  rank integer not null default 0 check (rank >= 0),
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id text primary key,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id text not null references public.roles(id) on delete cascade,
  permission_id text not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.user_roles (
  user_id text not null references public.users(id) on delete cascade,
  role_id text not null references public.roles(id) on delete cascade,
  granted_by text references public.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create index if not exists user_roles_role_idx on public.user_roles(role_id, user_id);
create index if not exists role_permissions_permission_idx
  on public.role_permissions(permission_id, role_id);

insert into public.roles (id, name, rank, is_system)
values
  ('user', 'Membro', 10, true),
  ('curator', 'Curador', 30, true),
  ('editor', 'Editor', 40, true),
  ('moderator', 'Moderador', 50, true),
  ('admin', 'Administrador', 100, true)
on conflict (id) do update
set name = excluded.name, rank = excluded.rank, is_system = excluded.is_system;

insert into public.permissions (id, description)
values
  ('content.read', 'Ler conteúdo disponível ao usuário.'),
  ('content.curate', 'Curar e organizar conteúdo.'),
  ('content.edit', 'Editar conteúdo sob responsabilidade editorial.'),
  ('moderation.queue', 'Acessar filas de moderação.'),
  ('moderation.content', 'Moderar conteúdo e denúncias.'),
  ('users.manage', 'Gerenciar estado e função de usuários.'),
  ('roles.manage', 'Gerenciar atribuições de cargos e permissões.'),
  ('settings.manage', 'Gerenciar configurações administrativas.'),
  ('admin.full', 'Acesso administrativo integral do Studiorium.')
on conflict (id) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
values
  ('user', 'content.read'),
  ('curator', 'content.read'),
  ('curator', 'content.curate'),
  ('editor', 'content.read'),
  ('editor', 'content.curate'),
  ('editor', 'content.edit'),
  ('moderator', 'content.read'),
  ('moderator', 'moderation.queue'),
  ('moderator', 'moderation.content'),
  ('admin', 'content.read'),
  ('admin', 'content.curate'),
  ('admin', 'content.edit'),
  ('admin', 'moderation.queue'),
  ('admin', 'moderation.content'),
  ('admin', 'users.manage'),
  ('admin', 'roles.manage'),
  ('admin', 'settings.manage'),
  ('admin', 'admin.full')
on conflict do nothing;

-- Backfill conservador: transforma o cargo legado atual em atribuição RBAC.
insert into public.user_roles (user_id, role_id)
select u.id, u.role
from public.users u
join public.roles r on r.id = u.role
on conflict (user_id, role_id) do nothing;

-- Padronização temporal/soft delete. Campos novos são aditivos e não alteram linhas existentes.
alter table public.users add column if not exists updated_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.publications add column if not exists updated_at timestamptz not null default now();
alter table public.publications add column if not exists deleted_at timestamptz;
alter table public.discussions add column if not exists updated_at timestamptz not null default now();
alter table public.discussions add column if not exists deleted_at timestamptz;
alter table public.replies add column if not exists updated_at timestamptz not null default now();
alter table public.replies add column if not exists deleted_at timestamptz;
alter table public.communities add column if not exists deleted_at timestamptz;

-- Integridade de contadores e buscas frequentes.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'publications_views_nonnegative') then
    alter table public.publications
      add constraint publications_views_nonnegative check (views >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'publications_downloads_nonnegative') then
    alter table public.publications
      add constraint publications_downloads_nonnegative check (downloads >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'publications_boosts_nonnegative') then
    alter table public.publications
      add constraint publications_boosts_nonnegative check (boosts >= 0) not valid;
  end if;
end $$;

create index if not exists publications_active_status_created_idx
  on public.publications(status, created_at desc)
  where deleted_at is null;
create index if not exists discussions_active_status_created_idx
  on public.discussions(status, created_at desc)
  where deleted_at is null;
create index if not exists replies_active_discussion_created_idx
  on public.replies(discussion_id, created_at)
  where deleted_at is null;
create index if not exists communities_active_area_name_idx
  on public.communities(area, name)
  where status = 'active' and deleted_at is null;

-- Não expor as tabelas de autorização pelo Data API do navegador.
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.studiorium_schema_migrations enable row level security;

revoke all on table public.roles from public, anon, authenticated;
revoke all on table public.permissions from public, anon, authenticated;
revoke all on table public.role_permissions from public, anon, authenticated;
revoke all on table public.user_roles from public, anon, authenticated;
revoke all on table public.studiorium_schema_migrations from public, anon, authenticated;

grant select, insert, update, delete on table public.roles to service_role;
grant select, insert, update, delete on table public.permissions to service_role;
grant select, insert, update, delete on table public.role_permissions to service_role;
grant select, insert, update, delete on table public.user_roles to service_role;
grant select, insert, update, delete on table public.studiorium_schema_migrations to service_role;

insert into public.studiorium_schema_migrations (migration_id, description)
values ('v3.5-data-architecture', 'RBAC, soft delete consistente, integridade e índices de domínio')
on conflict (migration_id) do update set description = excluded.description;

commit;
