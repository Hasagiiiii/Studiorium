-- Studiorium v3.1.1 — projetos acadêmicos compartilháveis.
-- A moderação local é implementada no servidor e não exige alteração de banco.

alter table public.projects
  add column if not exists visibility text not null default 'private';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.projects'::regclass
      and conname = 'projects_visibility_check'
  ) then
    alter table public.projects
      add constraint projects_visibility_check
      check (visibility in ('private', 'public'));
  end if;
end $$;

create index if not exists projects_public_updated_idx
  on public.projects(updated_at desc)
  where visibility = 'public' and deleted_at is null;

revoke all on table public.projects from public, anon, authenticated;
grant select, insert, update, delete on table public.projects to service_role;
