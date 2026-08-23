create or replace function public.set_user_account_status(
  p_user_id text,
  p_status text,
  p_reason text
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_status not in ('active','suspended') then return false; end if;
  update public.users
  set status = p_status,
      suspension_reason = case when p_status='suspended' then coalesce(p_reason,'') else '' end,
      suspended_at = case when p_status='suspended' then now() else null end,
      updated_at = now()
  where id = p_user_id;
  if not found then return false; end if;
  if p_status='suspended' then
    delete from public.sessions where user_id = p_user_id;
  end if;
  return true;
end;
$$;
revoke all on function public.set_user_account_status(text,text,text) from public,anon,authenticated;
grant execute on function public.set_user_account_status(text,text,text) to service_role;
