-- Lorion v4: cria discussão e vínculo comunitário na mesma transação.
create or replace function public.create_community_discussion(
  p_community_id text,
  p_discussion_id text,
  p_author_id text,
  p_author_name text,
  p_title text,
  p_body text,
  p_category text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.communities c
    join public.community_members m on m.community_id = c.id
    where c.id = p_community_id
      and c.status = 'active'
      and c.deleted_at is null
      and m.user_id = p_author_id
      and m.status = 'active'
      and m.moderation_status = 'clear'
  ) then
    return false;
  end if;

  insert into public.discussions (
    id, author_id, author_name, title, body, category, status
  ) values (
    p_discussion_id, p_author_id, p_author_name, p_title, p_body, p_category, 'published'
  );

  insert into public.community_content_links (
    community_id, content_type, content_id, status
  ) values (
    p_community_id, 'discussion', p_discussion_id, 'visible'
  );

  return true;
end;
$$;

revoke all on function public.create_community_discussion(text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_community_discussion(text, text, text, text, text, text, text)
  to service_role;
