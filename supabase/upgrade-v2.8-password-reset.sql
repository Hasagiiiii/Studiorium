-- Redefinição privada: token armazenado apenas como hash, validade curta e uso único.
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

alter table public.password_reset_tokens enable row level security;

revoke all on table public.password_reset_tokens from public, anon, authenticated;
grant select, insert, update, delete on table public.password_reset_tokens to service_role;

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

revoke all on function public.complete_password_reset(text, text)
  from public, anon, authenticated;
grant execute on function public.complete_password_reset(text, text)
  to service_role;
