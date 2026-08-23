create table if not exists public.user_safety_controls (
  actor_id text not null references public.users(id) on delete cascade,
  target_user_id text not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('block','mute')),
  created_at timestamptz not null default now(),
  primary key (actor_id, target_user_id, kind),
  constraint user_safety_controls_not_self check (actor_id <> target_user_id)
);

create index if not exists user_safety_controls_target_kind_idx
  on public.user_safety_controls (target_user_id, kind, actor_id);

alter table public.user_safety_controls enable row level security;
revoke all on table public.user_safety_controls from public, anon, authenticated;
grant select, insert, delete on table public.user_safety_controls to service_role;

create or replace function public.set_user_safety_control(
  p_actor_id text,
  p_target_user_id text,
  p_kind text,
  p_enabled boolean
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_actor_id is null or p_target_user_id is null or p_actor_id = p_target_user_id then
    return false;
  end if;
  if p_kind not in ('block','mute') then
    return false;
  end if;
  if not exists (select 1 from public.users where id = p_actor_id and status = 'active')
     or not exists (select 1 from public.users where id = p_target_user_id and status = 'active') then
    return false;
  end if;

  if p_enabled then
    insert into public.user_safety_controls(actor_id,target_user_id,kind)
    values (p_actor_id,p_target_user_id,p_kind)
    on conflict (actor_id,target_user_id,kind) do nothing;
    if p_kind = 'block' then
      delete from public.user_follows
      where (follower_id = p_actor_id and followed_id = p_target_user_id)
         or (follower_id = p_target_user_id and followed_id = p_actor_id);
    end if;
  else
    delete from public.user_safety_controls
    where actor_id = p_actor_id and target_user_id = p_target_user_id and kind = p_kind;
  end if;
  return true;
end;
$$;

revoke all on function public.set_user_safety_control(text,text,text,boolean) from public, anon, authenticated;
grant execute on function public.set_user_safety_control(text,text,text,boolean) to service_role;
