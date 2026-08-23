-- Lorion v4: interação social canônica para conteúdos registrados em content_items.
create table if not exists public.content_likes (
  content_id text not null references public.content_items(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (content_id, user_id)
);

create index if not exists content_likes_user_created_idx
  on public.content_likes (user_id, created_at desc);

create table if not exists public.content_comments (
  id text primary key,
  content_id text not null references public.content_items(id) on delete cascade,
  author_id text not null references public.users(id) on delete cascade,
  parent_id text null,
  body text not null,
  moderation_status text not null default 'clear',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  constraint content_comments_body_check
    check (char_length(btrim(body)) between 1 and 2000),
  constraint content_comments_moderation_check
    check (moderation_status in ('clear', 'hidden', 'pending_review', 'removed')),
  constraint content_comments_id_content_unique unique (id, content_id),
  constraint content_comments_parent_same_content_fkey
    foreign key (parent_id, content_id)
    references public.content_comments(id, content_id)
    on delete cascade
);

create index if not exists content_comments_content_created_idx
  on public.content_comments (content_id, created_at asc)
  where deleted_at is null;

create index if not exists content_comments_author_created_idx
  on public.content_comments (author_id, created_at desc)
  where deleted_at is null;

create index if not exists content_comments_parent_content_idx
  on public.content_comments (parent_id, content_id);

alter table public.content_likes enable row level security;
alter table public.content_comments enable row level security;

revoke all on table public.content_likes from public, anon, authenticated;
revoke all on table public.content_comments from public, anon, authenticated;

grant select, insert, delete on table public.content_likes to service_role;
grant select, insert, update, delete on table public.content_comments to service_role;
