-- Studiorium v2.4.1 — compatibilidade da auditoria de segurança
alter table public.security_events add column if not exists event text;
alter table public.security_events add column if not exists email_hash text;

update public.security_events
set event = coalesce(event, event_type)
where event is null;

update public.security_events
set email_hash = coalesce(email_hash, identity_hash)
where email_hash is null;

create index if not exists security_events_event_created_idx on public.security_events(event, created_at desc);
