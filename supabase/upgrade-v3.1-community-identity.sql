-- Studiorium v3.1 — identidade acadêmica, equipe, estante e descoberta comunitária.

alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check
  check (role in ('user', 'moderator', 'curator', 'editor', 'admin'));

alter table public.profiles add column if not exists course text not null default '';
alter table public.profiles add column if not exists institution text not null default '';
alter table public.profiles add column if not exists education_level text not null default '';
alter table public.profiles
  add column if not exists verification_status text not null default 'unverified';
alter table public.profiles add column if not exists verified_specialty text not null default '';
alter table public.profiles add column if not exists verified_at timestamptz;
alter table public.profiles add column if not exists verified_by text;
alter table public.profiles
  add column if not exists contribution_status text not null default 'member';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_verification_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_verification_status_check
      check (verification_status in ('unverified', 'pending', 'verified', 'rejected'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_contribution_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_contribution_status_check
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
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewer_id text,
  review_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibilidade com a primeira versão 3.1 aplicada em produção, que usava
-- education_status, expertise_area e proof_url. As colunas novas mantêm a API
-- atual sem apagar nem renomear os dados já registrados.
alter table public.profile_verification_requests
  add column if not exists education_level text not null default '';
alter table public.profile_verification_requests
  add column if not exists specialty text not null default '';
alter table public.profile_verification_requests
  add column if not exists credential_reference text not null default '';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile_verification_requests'
      and column_name = 'requested_level'
  ) then
    alter table public.profile_verification_requests
      alter column requested_level set default 'specialist';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile_verification_requests'
      and column_name = 'proof_url'
  ) then
    alter table public.profile_verification_requests
      alter column proof_url set default '';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'education_status'
  ) then
    execute $sql$
      update public.profiles
      set education_level = education_status
      where education_level = '' and education_status <> ''
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'expertise_area'
  ) then
    execute $sql$
      update public.profiles
      set verified_specialty = expertise_area
      where verified_specialty = '' and expertise_area <> ''
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'verification_level'
  ) then
    execute $sql$
      update public.profiles
      set verification_status = case
            when verification_level in ('identity', 'specialist') then 'verified'
            else verification_status
          end,
          contribution_status = case
            when verification_level = 'specialist' then 'specialist'
            else contribution_status
          end
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile_verification_requests'
      and column_name = 'education_status'
  ) then
    execute $sql$
      update public.profile_verification_requests
      set education_level = education_status
      where education_level = '' and education_status <> ''
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile_verification_requests'
      and column_name = 'expertise_area'
  ) then
    execute $sql$
      update public.profile_verification_requests
      set specialty = expertise_area
      where specialty = '' and expertise_area <> ''
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile_verification_requests'
      and column_name = 'proof_url'
  ) then
    execute $sql$
      update public.profile_verification_requests
      set credential_reference = proof_url
      where credential_reference = '' and proof_url <> ''
    $sql$;
  end if;
end $$;

create unique index if not exists profile_verification_one_pending_idx
  on public.profile_verification_requests(user_id)
  where status = 'pending';
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
  on public.notifications(user_id, created_at desc)
  where read_at is null;

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

create or replace function public.boost_publication(
  p_publication_id text,
  p_user_id text
)
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
  where id = p_publication_id
    and status = 'published'
    and owner_id <> p_user_id
  on conflict do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 1 then
    update public.publications
    set boosts = boosts + 1
    where id = p_publication_id
    returning boosts into current_boosts;
  else
    select boosts into current_boosts
    from public.publications
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

  if target_request.user_id is null then
    return null;
  end if;

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
