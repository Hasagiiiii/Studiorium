-- Lorion v4: fundação canônica para conteúdo social e posts curtos.
create table if not exists public.content_items (
  id text primary key,
  type text not null,
  author_id text not null references public.users(id) on delete cascade,
  community_id text references public.communities(id) on delete set null,
  visibility text not null default 'public',
  moderation_status text not null default 'clear',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_type_check check (
    type in ('post', 'discussion', 'research', 'project', 'book_review', 'news', 'project_update')
  ),
  constraint content_items_visibility_check check (visibility in ('public', 'community')),
  constraint content_items_moderation_check check (
    moderation_status in ('clear', 'hidden', 'pending_review', 'removed')
  ),
  constraint content_items_community_visibility_check check (
    visibility <> 'community' or community_id is not null
  )
);

create table if not exists public.posts (
  content_id text primary key references public.content_items(id) on delete cascade,
  title text not null default '',
  body text not null,
  constraint posts_title_length_check check (char_length(title) <= 160),
  constraint posts_body_length_check check (char_length(body) between 1 and 4000)
);

create index if not exists content_items_public_feed_idx
  on public.content_items (created_at desc)
  where type = 'post' and visibility = 'public' and moderation_status = 'clear';

create index if not exists content_items_author_idx
  on public.content_items (author_id, created_at desc)
  where type = 'post' and moderation_status = 'clear';

create index if not exists content_items_community_idx
  on public.content_items (community_id, created_at desc)
  where type = 'post' and moderation_status = 'clear';

alter table public.content_items enable row level security;
alter table public.posts enable row level security;

revoke all on table public.content_items from public, anon, authenticated;
revoke all on table public.posts from public, anon, authenticated;
grant select, insert, update, delete on table public.content_items to service_role;
grant select, insert, update, delete on table public.posts to service_role;

create or replace function public.create_social_post(
  p_content_id text,
  p_author_id text,
  p_title text,
  p_body text,
  p_community_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_visibility text := 'public';
  v_community_visibility text;
begin
  if char_length(trim(coalesce(p_body, ''))) < 1
     or char_length(p_body) > 4000
     or char_length(coalesce(p_title, '')) > 160 then
    return false;
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = p_author_id
      and u.status = 'active'
  ) then
    return false;
  end if;

  if p_community_id is not null then
    select c.visibility
      into v_community_visibility
    from public.communities c
    join public.community_members m on m.community_id = c.id
    where c.id = p_community_id
      and c.status = 'active'
      and c.deleted_at is null
      and m.user_id = p_author_id
      and m.status = 'active'
      and m.moderation_status = 'clear';

    if v_community_visibility is null then
      return false;
    end if;

    v_visibility := case
      when v_community_visibility = 'public' then 'public'
      else 'community'
    end;
  end if;

  insert into public.content_items (
    id, type, author_id, community_id, visibility, moderation_status
  ) values (
    p_content_id, 'post', p_author_id, p_community_id, v_visibility, 'clear'
  );

  insert into public.posts (content_id, title, body)
  values (p_content_id, trim(coalesce(p_title, '')), trim(p_body));

  return true;
end;
$$;

revoke all on function public.create_social_post(text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_social_post(text, text, text, text, text)
  to service_role;
