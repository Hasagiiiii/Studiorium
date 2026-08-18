-- Studiorium v2.6.1 — defesa em profundidade para acesso ao banco.
-- O frontend nunca acessa estas tabelas diretamente; somente a API usa service_role.

revoke all privileges on table
  public.users,
  public.profiles,
  public.sessions,
  public.templates,
  public.projects,
  public.publications,
  public.discussions,
  public.replies,
  public.reports,
  public.site_settings,
  public.admin_audit_log,
  public.auth_rate_limits,
  public.security_events,
  public.tech_resources,
  public.code_projects
from anon, authenticated;

revoke all privileges on all sequences in schema public from anon, authenticated;

revoke all privileges on function public.increment_publication_views(text) from anon, authenticated;
revoke all privileges on function public.increment_publication_downloads(text) from anon, authenticated;
