-- Compatibilidade definitiva entre o schema legado e o campo canônico `event`.
alter table public.security_events
  add column if not exists event text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'security_events'
      and column_name = 'event_type'
  ) then
    execute $sql$
      update public.security_events
      set event = coalesce(nullif(event, ''), nullif(event_type, ''), 'unknown')
      where event is null or event = ''
    $sql$;
  else
    update public.security_events
    set event = 'unknown'
    where event is null or event = '';
  end if;
end
$$;

alter table public.security_events
  alter column event set not null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'security_events'
      and column_name = 'event_type'
  ) then
    alter table public.security_events
      alter column event_type drop not null;
  end if;
end
$$;

create index if not exists security_events_event_created_idx
  on public.security_events(event, created_at desc);
