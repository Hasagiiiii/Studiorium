alter table public.publications drop constraint if exists publications_status_check;
alter table public.publications add constraint publications_status_check
  check (status = any (array['draft'::text,'pending_review'::text,'published'::text,'rejected'::text]));
alter table public.publications alter column status set default 'draft';
