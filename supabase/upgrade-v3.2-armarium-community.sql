-- Studiorium v3.2 — Armarium comunitário, reviews e links externos seguros.
-- Esta migração substitui os seis livros de demonstração por um catálogo criado pela comunidade.

alter table public.books add column if not exists submitted_by text references public.users(id) on delete set null;
alter table public.books add column if not exists isbn text not null default '';
alter table public.books add column if not exists cover_url text not null default '';
alter table public.books add column if not exists purchase_url text not null default '';
alter table public.books add column if not exists purchase_label text not null default '';
alter table public.books add column if not exists rating_average numeric(3,2) not null default 0;
alter table public.books add column if not exists review_count integer not null default 0;
alter table public.books add column if not exists recommendation_count integer not null default 0;

create index if not exists books_created_idx on public.books(created_at desc);
create index if not exists books_recommendation_idx
  on public.books(recommendation_count desc, rating_average desc, created_at desc);

create table if not exists public.book_reviews (
  book_id text not null references public.books(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  reviewer_name text not null default 'Membro da comunidade',
  rating integer not null check (rating between 1 and 5),
  review text not null default '',
  recommend boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (book_id, user_id)
);

create index if not exists book_reviews_book_updated_idx
  on public.book_reviews(book_id, updated_at desc);
create index if not exists book_reviews_user_updated_idx
  on public.book_reviews(user_id, updated_at desc);

alter table public.book_reviews enable row level security;
revoke all on table public.book_reviews from public, anon, authenticated;
grant select, insert, update, delete on table public.book_reviews to service_role;

-- Os seis registros abaixo foram apenas conteúdo de demonstração da v3.1.
-- Remover primeiro os saves evita qualquer dependência em instalações onde alguém tenha clicado neles.
delete from public.book_saves
where book_id in (
  'book-republica',
  'book-metodo',
  'book-especies',
  'book-dom-casmurro',
  'book-quarto-despejo',
  'book-pedagogia-autonomia'
);

delete from public.books
where id in (
  'book-republica',
  'book-metodo',
  'book-especies',
  'book-dom-casmurro',
  'book-quarto-despejo',
  'book-pedagogia-autonomia'
);
