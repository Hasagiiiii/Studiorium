-- Lorion v4: completa os estados funcionais da estante de livros.
alter table public.book_saves
  drop constraint if exists book_saves_shelf_status_check;

alter table public.book_saves
  add constraint book_saves_shelf_status_check
  check (shelf_status in ('want_to_read', 'reading', 'read', 'abandoned'));
