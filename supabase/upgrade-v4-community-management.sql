alter table public.communities add column if not exists avatar_path text;
alter table public.communities add column if not exists cover_path text;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('community-media','community-media',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.create_community_v4(
  p_id text,
  p_slug text,
  p_name text,
  p_area text,
  p_description text,
  p_visibility text,
  p_rules jsonb,
  p_creator_id text
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.users where id=p_creator_id and status='active') then
    raise exception 'creator_not_active';
  end if;
  if p_visibility not in ('public','restricted','private') then
    raise exception 'invalid_visibility';
  end if;
  if jsonb_typeof(p_rules) <> 'array' then
    raise exception 'invalid_rules';
  end if;

  insert into public.communities (
    id,slug,name,area,description,visibility,status,is_official,rules,created_by,created_at,updated_at
  ) values (
    p_id,p_slug,p_name,p_area,p_description,p_visibility,'active',false,p_rules,p_creator_id,now(),now()
  );

  insert into public.community_members (
    community_id,user_id,role,status,moderation_status,joined_at,updated_at
  ) values (
    p_id,p_creator_id,'leader','active','clear',now(),now()
  );

  return p_id;
end;
$$;

revoke all on function public.create_community_v4(text,text,text,text,text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.create_community_v4(text,text,text,text,text,text,jsonb,text) to service_role;

create or replace function public.transfer_community_leadership(
  p_community_id text,
  p_current_leader text,
  p_new_leader text
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$;
begin
  if p_current_leader = p_new_leader then return false; end if;

  if not exists (
    select 1 from public.community_members
    where community_id=p_community_id and user_id=p_current_leader
      and status='active' and moderation_status='clear' and role='leader'
  ) then return false; end if;

  if not exists (
    select 1 from public.community_members
    where community_id=p_community_id and user_id=p_new_leader
      and status='active' and moderation_status='clear'
  ) then return false; end if;

  update public.community_members
    set role='moderator', updated_at=now()
    where community_id=p_community_id and user_id=p_current_leader;
  update public.community_members
    set role='leader', updated_at=now()
    where community_id=p_community_id and user_id=p_new_leader;
  return true;
end;
$$;

revoke all on function public.transfer_community_leadership(text,text,text) from public, anon, authenticated;
grant execute on function public.transfer_community_leadership(text,text,text) to service_role;
