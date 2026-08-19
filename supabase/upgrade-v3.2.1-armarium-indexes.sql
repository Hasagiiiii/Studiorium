-- Studiorium v3.2.1 — ajustes indicados pelo Performance Advisor.

create index if not exists book_saves_book_idx
  on public.book_saves(book_id);

create index if not exists books_submitted_by_idx
  on public.books(submitted_by)
  where submitted_by is not null;

-- A v3.1 deixou dois índices equivalentes para a mesma fila.
drop index if exists public.profile_verification_pending_idx;
