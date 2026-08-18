-- Studiorium v2.5 — bootstrap seguro da conta administradora
-- Contas comuns continuam exigindo ano de nascimento na API.
-- A conta administrativa provisionada pelo operador pode deixar esse campo nulo.

alter table public.users alter column birth_year drop not null;
