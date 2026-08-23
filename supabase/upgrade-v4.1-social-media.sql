-- Lorion v4.1 — public social posts and binary media metadata.
-- Application authorization remains server-side. The service role owns DB writes,
-- while browser uploads use one-time signed Storage upload URLs.

create table if not exists public.social_media (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  bucket text not null default 'lorion-media',
  path text not null unique,
  public_url text not null,
  kind text not null check (kind in ('image', 'video')),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 83886080),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_seconds numeric(8,3) check (
    duration_seconds is null or (duration_seconds > 0 and duration_seconds <= 60)
  ),
  status text not null default 'pending' check (status in ('pending', 'ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_media_user_created_idx
  on public.social_media(user_id, created_at desc);
create index if not exists social_media_status_created_idx
  on public.social_media(status, created_at desc);

create table if not exists public.social_posts (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('text', 'photo', 'photo_text', 'video')),
  body text,
  media_id text unique references public.social_media(id) on delete restrict,
  like_count integer not null default 0 check (like_count >= 0),
  created_at timestamptz not null default now(),
  constraint social_posts_body_length check (body is null or char_length(body) <= 5000),
  constraint social_posts_shape check (
    (kind = 'text' and body is not null and btrim(body) <> '' and media_id is null)
    or (kind = 'photo' and body is null and media_id is not null)
    or (kind = 'photo_text' and body is not null and btrim(body) <> '' and media_id is not null)
    or (kind = 'video' and media_id is not null)
  )
);

create index if not exists social_posts_user_created_idx
  on public.social_posts(user_id, created_at desc);
create index if not exists social_posts_created_idx
  on public.social_posts(created_at desc);

alter table public.social_media enable row level security;
alter table public.social_posts enable row level security;

revoke all on public.social_media from anon, authenticated;
revoke all on public.social_posts from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lorion-media',
  'lorion-media',
  true,
  83886080,
  array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
