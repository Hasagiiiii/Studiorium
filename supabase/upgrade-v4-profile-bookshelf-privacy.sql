-- Lorion v4: a estante pessoal começa privada e só aparece no perfil por opt-in.
alter table public.profiles
  add column if not exists bookshelf_public boolean not null default false;

comment on column public.profiles.bookshelf_public is
  'Controls whether the user bookshelf may be shown on their public profile.';
