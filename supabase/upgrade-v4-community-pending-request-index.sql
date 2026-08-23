-- Lorion v4: acelera a fila de solicitações pendentes por comunidade.
create index if not exists community_members_pending_requests_idx
  on public.community_members (community_id, joined_at)
  where status = 'pending' and moderation_status = 'clear';
