-- Studiorium v3.2.9 — hype comunitário para notícias certificadas.

alter table public.news_articles
  add column if not exists hypes integer not null default 0;

alter table public.news_articles
  drop constraint if exists news_articles_hypes_nonnegative;

alter table public.news_articles
  add constraint news_articles_hypes_nonnegative check (hypes >= 0);

create table if not exists public.news_hypes (
  article_id text not null references public.news_articles(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

alter table public.news_hypes enable row level security;
revoke all on table public.news_hypes from public, anon, authenticated;
grant all on table public.news_hypes to service_role;

create index if not exists news_hypes_user_idx on public.news_hypes(user_id);
create index if not exists news_articles_public_rank_idx
  on public.news_articles(featured desc, hypes desc, published_at desc)
  where status = 'published' and certified_at is not null and deleted_at is null;

create or replace function public.hype_news_article(p_article_id text, p_user_id text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count integer := 0;
  current_hypes integer := 0;
begin
  insert into public.news_hypes(article_id, user_id)
  select p_article_id, p_user_id
  from public.news_articles
  where id = p_article_id
    and status = 'published'
    and certified_at is not null
    and deleted_at is null
    and contributor_id <> p_user_id
  on conflict do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 1 then
    update public.news_articles
    set hypes = hypes + 1
    where id = p_article_id
    returning hypes into current_hypes;
  else
    select hypes into current_hypes
    from public.news_articles
    where id = p_article_id
      and status = 'published'
      and certified_at is not null
      and deleted_at is null;
  end if;

  if current_hypes is null then
    raise exception 'Notícia não encontrada ou não pode receber hype.';
  end if;

  return current_hypes;
end;
$$;

revoke all on function public.hype_news_article(text, text) from public, anon, authenticated;
grant execute on function public.hype_news_article(text, text) to service_role;
