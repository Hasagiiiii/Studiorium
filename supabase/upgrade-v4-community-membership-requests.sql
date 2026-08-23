-- Lorion v4: estados de solicitação para comunidades de acesso controlado.
alter table public.community_members
  drop constraint if exists community_members_status_check;

alter table public.community_members
  add constraint community_members_status_check
  check (status in ('active', 'left', 'pending', 'rejected'));
