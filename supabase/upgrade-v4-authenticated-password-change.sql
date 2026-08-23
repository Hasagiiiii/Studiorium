-- Lorion v4: troca de senha autenticada atômica e privada.
-- A API valida a senha atual antes de chamar esta função com service_role.
create or replace function public.complete_authenticated_password_change(
  p_user_id text,
  p_password_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.users
  set password_hash = p_password_hash
  where id = p_user_id
    and coalesce(status, 'active') <> 'suspended';

  if not found then
    return false;
  end if;

  delete from public.sessions
  where user_id = p_user_id;

  return true;
end;
$$;

revoke all on function public.complete_authenticated_password_change(text, text)
  from public, anon, authenticated;
grant execute on function public.complete_authenticated_password_change(text, text)
  to service_role;
