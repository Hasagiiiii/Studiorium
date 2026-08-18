-- Studiorium v2.6 — índices de suporte às chaves estrangeiras
-- Seguro para reaplicação.

create index if not exists projects_template_id_idx
  on public.projects(template_id);

create index if not exists reports_reporter_id_idx
  on public.reports(reporter_id);

create index if not exists tech_resources_owner_id_idx
  on public.tech_resources(owner_id);
