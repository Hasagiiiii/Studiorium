-- Studiorium Online — Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  role text not null default 'user'
    check (role in ('user', 'moderator', 'curator', 'editor', 'admin')),
  status text not null default 'active' check (status in ('active','suspended')),
  suspension_reason text not null default '',
  suspended_at timestamptz,
  is_minor boolean not null default false,
  birth_year integer,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id text primary key,
  username text not null unique,
  display_name text not null,
  bio text not null default '',
  profile_type text not null default 'estudante',
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  token_hash text primary key,
  user_id text not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists sessions_expires_at_idx on public.sessions(expires_at);

create table if not exists public.password_reset_tokens (
  token_hash text primary key,
  user_id text not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint password_reset_token_hash_length check (length(token_hash) = 64)
);
create index if not exists password_reset_tokens_user_idx
  on public.password_reset_tokens(user_id);
create index if not exists password_reset_tokens_expires_idx
  on public.password_reset_tokens(expires_at);

create table if not exists public.templates (
  id text primary key,
  title text not null,
  slug text not null unique,
  category text not null,
  doc_type text not null,
  style text not null default 'Clássico',
  description text not null default '',
  downloads integer not null default 0,
  featured boolean not null default false,
  sections jsonb not null default '[]'::jsonb
);

create table if not exists public.projects (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  title text not null,
  template_id text references public.templates(id) on delete set null,
  type text not null,
  visibility text not null default 'private'
    check (visibility in ('private', 'public')),
  sections jsonb not null default '[]'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_template_id_idx on public.projects(template_id);

create table if not exists public.publications (
  id text primary key,
  owner_id text not null,
  author_name text not null,
  title text not null,
  slug text not null unique,
  abstract text not null,
  content text not null default '',
  area text not null default 'Geral',
  level text not null default 'Não informado',
  keywords text[] not null default '{}',
  license text not null default 'Todos os direitos reservados',
  status text not null default 'pending_review' check (status in ('pending_review','published','rejected')),
  views integer not null default 0,
  downloads integer not null default 0,
  featured boolean not null default false,
  file_path text,
  file_name text,
  file_mime text,
  moderation_note text not null default '',
  created_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists publications_owner_idx on public.publications(owner_id);
create index if not exists publications_status_created_idx on public.publications(status, created_at desc);

create table if not exists public.discussions (
  id text primary key,
  author_id text not null,
  author_name text not null,
  title text not null,
  body text not null,
  category text not null default 'Geral',
  status text not null default 'published' check (status in ('published','hidden','pending_review')),
  created_at timestamptz not null default now()
);
create index if not exists discussions_status_created_idx on public.discussions(status, created_at desc);

create table if not exists public.replies (
  id text primary key,
  discussion_id text not null references public.discussions(id) on delete cascade,
  author_id text not null,
  author_name text not null,
  body text not null,
  status text not null default 'published' check (status in ('published','hidden','pending_review')),
  created_at timestamptz not null default now()
);
create index if not exists replies_discussion_idx on public.replies(discussion_id, created_at);

create table if not exists public.reports (
  id text primary key,
  reporter_id text not null references public.users(id) on delete cascade,
  target_type text not null check (target_type in ('publication','discussion','reply')),
  target_id text not null,
  category text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  priority text not null default 'normal' check (priority in ('normal','urgent')),
  moderator_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reports_queue_idx on public.reports(status, priority, created_at desc);
create index if not exists reports_reporter_id_idx on public.reports(reporter_id);

-- Atualizações idempotentes para projetos que já executaram uma versão anterior do schema.
alter table public.users add column if not exists status text not null default 'active';
alter table public.users add column if not exists suspension_reason text not null default '';
alter table public.users add column if not exists suspended_at timestamptz;
alter table public.users alter column birth_year drop not null;
alter table public.publications add column if not exists featured boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_status_check') then
    alter table public.users add constraint users_status_check check (status in ('active','suspended'));
  end if;
end $$;

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id bigint generated by default as identity primary key,
  admin_id text not null,
  action text not null,
  target_type text not null default 'system',
  target_id text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_created_idx on public.admin_audit_log(created_at desc);

create table if not exists public.auth_rate_limits (
  key text primary key,
  scope text not null,
  attempts integer not null default 0 check (attempts >= 0),
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists auth_rate_limits_updated_idx
  on public.auth_rate_limits(updated_at);
create index if not exists auth_rate_limits_blocked_idx
  on public.auth_rate_limits(blocked_until)
  where blocked_until is not null;

create table if not exists public.security_events (
  id bigint generated by default as identity primary key,
  event text not null,
  user_id text,
  email_hash text,
  ip_hash text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists security_events_created_idx
  on public.security_events(created_at desc);
create index if not exists security_events_event_idx
  on public.security_events(event, created_at desc);
create index if not exists security_events_user_idx
  on public.security_events(user_id, created_at desc)
  where user_id is not null;

-- O navegador nunca acessa estas tabelas diretamente. A API usa service role.
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.templates enable row level security;
alter table public.projects enable row level security;
alter table public.publications enable row level security;
alter table public.discussions enable row level security;
alter table public.replies enable row level security;
alter table public.reports enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.auth_rate_limits enable row level security;
alter table public.security_events enable row level security;
alter table public.password_reset_tokens enable row level security;

insert into storage.buckets (id, name, public, file_size_limit)
values ('publications', 'publications', false, 5242880)
on conflict (id) do update set public = false, file_size_limit = 5242880;

create or replace function public.increment_publication_views(p_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.publications
  set views = views + 1
  where id = p_id and status = 'published';
$$;

create or replace function public.increment_publication_downloads(p_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.publications
  set downloads = downloads + 1
  where id = p_id;
$$;

revoke all on function public.increment_publication_views(text) from public, anon, authenticated;
revoke all on function public.increment_publication_downloads(text) from public, anon, authenticated;

create or replace function public.complete_password_reset(
  p_token_hash text,
  p_password_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  reset_user_id text;
begin
  update public.password_reset_tokens
  set used_at = now()
  where token_hash = p_token_hash
    and used_at is null
    and expires_at > now()
  returning user_id into reset_user_id;

  if reset_user_id is null then
    return false;
  end if;

  update public.users
  set password_hash = p_password_hash
  where id = reset_user_id;

  delete from public.sessions
  where user_id = reset_user_id;

  return true;
end;
$$;

revoke all on table public.password_reset_tokens from public, anon, authenticated;
revoke all on function public.complete_password_reset(text, text)
  from public, anon, authenticated;

grant all on table public.users, public.profiles, public.sessions, public.templates, public.projects,
  public.publications, public.discussions, public.replies, public.reports, public.site_settings,
  public.admin_audit_log, public.auth_rate_limits, public.security_events to service_role;
grant select, insert, update, delete on table public.password_reset_tokens to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on function public.increment_publication_views(text) to service_role;
grant execute on function public.increment_publication_downloads(text) to service_role;
grant execute on function public.complete_password_reset(text, text) to service_role;

-- Studiorium v2.3 — Tecnologia, Oficina e Laboratório de Código
create table if not exists public.tech_resources (
 id text primary key, owner_id text not null references public.users(id) on delete cascade, author_name text not null,
 title text not null, slug text not null unique, summary text not null default '', body text not null default '',
 hub text not null default 'Tecnologia', category text not null default 'Tutorial', tags text[] not null default '{}',
 status text not null default 'pending_review' check(status in ('pending_review','published','rejected','hidden')),
 featured boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists tech_resources_hub_idx on public.tech_resources(hub,status,created_at desc);
create index if not exists tech_resources_owner_id_idx on public.tech_resources(owner_id);
create table if not exists public.code_projects (
  id text primary key,
  owner_id text not null references public.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  html text not null default '',
  css text not null default '',
  javascript text not null default '',
  visibility text not null default 'private' check(visibility in ('private','public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Studiorium v2.9 — redação colaborativa e estúdio de templates.
create table if not exists public.news_contributors (
  user_id text primary key references public.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  area text not null default '',
  institution text not null default '',
  portfolio_url text not null default '',
  statement text not null default '',
  reviewer_id text,
  review_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_articles (
  id text primary key,
  contributor_id text references public.users(id) on delete set null,
  author_name text not null,
  title text not null,
  slug text not null unique,
  summary text not null,
  body text not null,
  category text not null default 'Atualizações',
  sources jsonb not null default '[]'::jsonb
    check (jsonb_typeof(sources) = 'array'),
  status text not null default 'draft'
    check (
      status in (
        'draft',
        'ai_review',
        'editorial_review',
        'changes_requested',
        'published',
        'rejected',
        'archived'
      )
    ),
  ai_review_status text not null default 'pending'
    check (ai_review_status in ('pending', 'approved', 'flagged', 'unavailable')),
  ai_review jsonb not null default '{}'::jsonb,
  editorial_note text not null default '',
  featured boolean not null default false,
  certified_by text,
  certified_at timestamptz,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists news_articles_public_idx
  on public.news_articles(featured desc, published_at desc)
  where status = 'published' and certified_at is not null and deleted_at is null;
create index if not exists news_articles_contributor_idx
  on public.news_articles(contributor_id, updated_at desc);
create index if not exists news_articles_review_idx
  on public.news_articles(status, updated_at desc)
  where deleted_at is null;

create table if not exists public.custom_templates (
  id text primary key,
  owner_id text not null references public.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  document jsonb not null default '{"settings":{},"blocks":[]}'::jsonb
    check (jsonb_typeof(document) = 'object'),
  source_type text not null default 'editor'
    check (source_type in ('editor', 'imported_image', 'imported_pdf', 'imported_json')),
  status text not null default 'private'
    check (status in ('private', 'pending_review', 'published', 'rejected')),
  featured boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists custom_templates_owner_idx
  on public.custom_templates(owner_id, updated_at desc);
create index if not exists custom_templates_public_idx
  on public.custom_templates(featured desc, updated_at desc)
  where status = 'published' and deleted_at is null;

alter table public.projects add column if not exists deleted_at timestamptz;
alter table public.projects
  add column if not exists visibility text not null default 'private';
create index if not exists projects_public_updated_idx
  on public.projects(updated_at desc)
  where visibility = 'public' and deleted_at is null;
alter table public.code_projects add column if not exists deleted_at timestamptz;

alter table public.news_contributors enable row level security;
alter table public.news_articles enable row level security;
alter table public.custom_templates enable row level security;

revoke all on table public.news_contributors from public, anon, authenticated;
revoke all on table public.news_articles from public, anon, authenticated;
revoke all on table public.custom_templates from public, anon, authenticated;

grant select, insert, update, delete on table public.news_contributors to service_role;
grant select, insert, update, delete on table public.news_articles to service_role;
grant select, insert, update, delete on table public.custom_templates to service_role;

insert into storage.buckets (id, name, public, file_size_limit)
values ('template-assets', 'template-assets', false, 8388608)
on conflict (id) do update
set public = false,
    file_size_limit = 8388608;
create index if not exists code_projects_owner_idx on public.code_projects(owner_id,updated_at desc);
alter table public.tech_resources enable row level security;
alter table public.code_projects enable row level security;
grant all on table public.tech_resources, public.code_projects to service_role;

revoke all privileges on table
  public.users,
  public.profiles,
  public.sessions,
  public.templates,
  public.projects,
  public.publications,
  public.discussions,
  public.replies,
  public.reports,
  public.site_settings,
  public.admin_audit_log,
  public.auth_rate_limits,
  public.security_events,
  public.tech_resources,
  public.code_projects
from anon, authenticated;

revoke all privileges on all sequences in schema public from anon, authenticated;

-- Studiorium v3.1 — identidade acadêmica, equipe, estante e descoberta comunitária.
alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check
  check (role in ('user', 'moderator', 'curator', 'editor', 'admin'));

alter table public.profiles add column if not exists course text not null default '';
alter table public.profiles add column if not exists institution text not null default '';
alter table public.profiles add column if not exists education_level text not null default '';
alter table public.profiles add column if not exists verification_status text not null default 'unverified';
alter table public.profiles add column if not exists verified_specialty text not null default '';
alter table public.profiles add column if not exists verified_at timestamptz;
alter table public.profiles add column if not exists verified_by text;
alter table public.profiles add column if not exists contribution_status text not null default 'member';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_verification_status_check') then
    alter table public.profiles add constraint profiles_verification_status_check
      check (verification_status in ('unverified', 'pending', 'verified', 'rejected'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_contribution_status_check') then
    alter table public.profiles add constraint profiles_contribution_status_check
      check (contribution_status in ('member', 'active_collaborator', 'specialist'));
  end if;
end $$;

alter table public.publications add column if not exists cover_path text;
alter table public.publications add column if not exists cover_name text;
alter table public.publications add column if not exists cover_mime text;
alter table public.publications add column if not exists boosts integer not null default 0;

create table if not exists public.profile_verification_requests (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  profile_type text not null,
  course text not null default '',
  institution text not null default '',
  education_level text not null default '',
  specialty text not null default '',
  credential_reference text not null default '',
  statement text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewer_id text,
  review_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profile_verification_one_pending_idx
  on public.profile_verification_requests(user_id) where status = 'pending';
create index if not exists profile_verification_queue_idx
  on public.profile_verification_requests(status, created_at desc);

create table if not exists public.notifications (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  type text not null default 'system',
  title text not null,
  message text not null default '',
  link text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, created_at desc) where read_at is null;

create table if not exists public.books (
  id text primary key,
  title text not null,
  author text not null,
  description text not null default '',
  category text not null default 'Humanidades',
  cover_theme text not null default 'umber',
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.book_saves (
  user_id text not null references public.users(id) on delete cascade,
  book_id text not null references public.books(id) on delete cascade,
  shelf_status text not null default 'want_to_read'
    check (shelf_status in ('want_to_read', 'reading', 'read')),
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
create index if not exists book_saves_user_created_idx
  on public.book_saves(user_id, created_at desc);

create table if not exists public.publication_boosts (
  publication_id text not null references public.publications(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (publication_id, user_id)
);
create index if not exists publication_boosts_user_idx
  on public.publication_boosts(user_id, created_at desc);
create index if not exists publications_discovery_idx
  on public.publications(featured desc, boosts desc, created_at desc)
  where status = 'published';

alter table public.profile_verification_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.books enable row level security;
alter table public.book_saves enable row level security;
alter table public.publication_boosts enable row level security;

revoke all on table public.profile_verification_requests from public, anon, authenticated;
revoke all on table public.notifications from public, anon, authenticated;
revoke all on table public.books from public, anon, authenticated;
revoke all on table public.book_saves from public, anon, authenticated;
revoke all on table public.publication_boosts from public, anon, authenticated;

grant select, insert, update, delete on table public.profile_verification_requests to service_role;
grant select, insert, update, delete on table public.notifications to service_role;
grant select, insert, update, delete on table public.books to service_role;
grant select, insert, update, delete on table public.book_saves to service_role;
grant select, insert, update, delete on table public.publication_boosts to service_role;

create or replace function public.boost_publication(p_publication_id text, p_user_id text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count integer := 0;
  current_boosts integer := 0;
begin
  insert into public.publication_boosts(publication_id, user_id)
  select p_publication_id, p_user_id
  from public.publications
  where id = p_publication_id and status = 'published' and owner_id <> p_user_id
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 1 then
    update public.publications set boosts = boosts + 1
    where id = p_publication_id returning boosts into current_boosts;
  else
    select boosts into current_boosts from public.publications
    where id = p_publication_id and status = 'published';
  end if;
  if current_boosts is null then
    raise exception 'Publicação não encontrada ou não pode ser impulsionada.';
  end if;
  return current_boosts;
end;
$$;

revoke all on function public.boost_publication(text, text) from public, anon, authenticated;
grant execute on function public.boost_publication(text, text) to service_role;

create or replace function public.complete_profile_verification(
  p_request_id text,
  p_reviewer_id text,
  p_status text,
  p_note text,
  p_contribution_status text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_request public.profile_verification_requests%rowtype;
begin
  if p_status not in ('approved', 'rejected') then
    raise exception 'Decisão de verificação inválida.';
  end if;
  update public.profile_verification_requests
  set status = p_status,
      reviewer_id = p_reviewer_id,
      review_note = left(coalesce(p_note, ''), 1500),
      updated_at = now()
  where id = p_request_id and status = 'pending'
  returning * into target_request;
  if target_request.user_id is null then return null; end if;
  update public.profiles
  set course = target_request.course,
      institution = target_request.institution,
      education_level = target_request.education_level,
      verification_status = case when p_status = 'approved' then 'verified' else 'rejected' end,
      verified_specialty = case when p_status = 'approved' then target_request.specialty else '' end,
      contribution_status = case
        when p_status = 'approved' and p_contribution_status in ('active_collaborator', 'specialist')
          then p_contribution_status
        when p_status = 'approved' then 'specialist'
        else 'member'
      end,
      verified_at = case when p_status = 'approved' then now() else null end,
      verified_by = case when p_status = 'approved' then p_reviewer_id else null end
  where user_id = target_request.user_id;
  return target_request.user_id;
end;
$$;

revoke all on function public.complete_profile_verification(text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.complete_profile_verification(text, text, text, text, text)
  to service_role;

insert into public.books (id, title, author, description, category, cover_theme, featured)
values
  (
    'book-republica', 'A República', 'Platão',
    'Diálogos sobre justiça, educação e organização da vida coletiva.',
    'Filosofia', 'oxblood', true
  ),
  (
    'book-metodo', 'Discurso do Método', 'René Descartes',
    'Uma introdução clássica ao pensamento crítico e ao método racional.',
    'Filosofia', 'navy', true
  ),
  (
    'book-especies', 'A Origem das Espécies', 'Charles Darwin',
    'Obra fundamental para compreender a história do pensamento evolutivo.',
    'Ciências', 'forest', true
  ),
  (
    'book-dom-casmurro', 'Dom Casmurro', 'Machado de Assis',
    'Romance brasileiro sobre memória, narrativa e interpretação.',
    'Literatura', 'umber', false
  ),
  (
    'book-quarto-despejo', 'Quarto de Despejo', 'Carolina Maria de Jesus',
    'Diário essencial para discutir cidade, desigualdade e autoria.',
    'Literatura brasileira', 'plum', true
  ),
  (
    'book-pedagogia-autonomia', 'Pedagogia da Autonomia', 'Paulo Freire',
    'Reflexões sobre prática docente, ética e construção do conhecimento.',
    'Educação', 'olive', true
  )
on conflict (id) do nothing;
