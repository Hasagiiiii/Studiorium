-- Lorion v4: cobre a FK user_roles.granted_by usada por operações de RBAC/auditoria.
-- Aplicação idempotente; segura para bancos onde o índice já existe.

create index if not exists user_roles_granted_by_idx
  on public.user_roles (granted_by);
