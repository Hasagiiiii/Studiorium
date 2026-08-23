create unique index if not exists books_title_author_unique_idx
  on public.books (lower(title), lower(author));

create or replace function public.save_book_review(
  p_book_id text,
  p_user_id text,
  p_reviewer_name text,
  p_rating integer,
  p_review text,
  p_recommend boolean
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_rating < 1 or p_rating > 5 then return false; end if;
  if not exists (select 1 from public.books where id = p_book_id) then return false; end if;
  if not exists (select 1 from public.users where id = p_user_id and status = 'active') then return false; end if;

  insert into public.book_reviews(book_id,user_id,reviewer_name,rating,review,recommend,created_at,updated_at)
  values (p_book_id,p_user_id,p_reviewer_name,p_rating,p_review,p_recommend,now(),now())
  on conflict (book_id,user_id) do update set
    reviewer_name = excluded.reviewer_name,
    rating = excluded.rating,
    review = excluded.review,
    recommend = excluded.recommend,
    updated_at = now();

  insert into public.book_saves(user_id,book_id,shelf_status)
  values (p_user_id,p_book_id,'read')
  on conflict (user_id,book_id) do update set shelf_status = 'read';

  update public.books b set
    rating_average = coalesce((select round(avg(br.rating)::numeric,2) from public.book_reviews br where br.book_id=b.id),0),
    review_count = (select count(*) from public.book_reviews br where br.book_id=b.id),
    recommendation_count = (select count(*) from public.book_reviews br where br.book_id=b.id and br.recommend=true)
  where b.id = p_book_id;

  return true;
end;
$$;

create or replace function public.create_book_with_review(
  p_book_id text,
  p_user_id text,
  p_title text,
  p_author text,
  p_description text,
  p_category text,
  p_isbn text,
  p_cover_url text,
  p_purchase_url text,
  p_purchase_label text,
  p_reviewer_name text,
  p_rating integer,
  p_review text,
  p_recommend boolean
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_rating < 1 or p_rating > 5 then return null; end if;
  if not exists (select 1 from public.users where id=p_user_id and status='active') then return null; end if;

  insert into public.books(
    id,submitted_by,title,author,description,category,isbn,cover_url,purchase_url,purchase_label,
    cover_theme,featured,rating_average,review_count,recommendation_count,created_at
  ) values (
    p_book_id,p_user_id,p_title,p_author,p_description,p_category,p_isbn,p_cover_url,p_purchase_url,p_purchase_label,
    'umber',false,p_rating,1,case when p_recommend then 1 else 0 end,now()
  );

  insert into public.book_reviews(book_id,user_id,reviewer_name,rating,review,recommend)
  values (p_book_id,p_user_id,p_reviewer_name,p_rating,p_review,p_recommend);

  insert into public.book_saves(user_id,book_id,shelf_status)
  values (p_user_id,p_book_id,'read');

  return p_book_id;
exception when unique_violation then
  return null;
end;
$$;

revoke all on function public.save_book_review(text,text,text,integer,text,boolean) from public,anon,authenticated;
revoke all on function public.create_book_with_review(text,text,text,text,text,text,text,text,text,text,text,integer,text,boolean) from public,anon,authenticated;
grant execute on function public.save_book_review(text,text,text,integer,text,boolean) to service_role;
grant execute on function public.create_book_with_review(text,text,text,text,text,text,text,text,text,text,text,integer,text,boolean) to service_role;
