-- Studiorium v3.4 — fundação de Comunidades.
-- O frontend não acessa estas tabelas diretamente; a API Node usa a credencial de servidor.

create table if not exists public.communities (
  id text primary key,
  slug text not null unique,
  name text not null,
  area text not null default 'Geral',
  description text not null default '',
  visibility text not null default 'public'
    check (visibility in ('public', 'restricted', 'private')),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  is_official boolean not null default true,
  rules jsonb not null default '[]'::jsonb
    check (jsonb_typeof(rules) = 'array'),
  created_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists communities_area_status_idx
  on public.communities(area, status, name);

create table if not exists public.community_members (
  community_id text not null references public.communities(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('member', 'moderator', 'curator', 'manager')),
  status text not null default 'active'
    check (status in ('active', 'muted', 'removed')),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index if not exists community_members_user_idx
  on public.community_members(user_id, status, joined_at desc);
create index if not exists community_members_community_idx
  on public.community_members(community_id, status, joined_at desc);

create table if not exists public.community_content_links (
  community_id text not null references public.communities(id) on delete cascade,
  content_type text not null
    check (
      content_type in (
        'discussion',
        'tech_resource',
        'project',
        'code_project',
        'publication',
        'custom_template',
        'book'
      )
    ),
  content_id text not null,
  created_at timestamptz not null default now(),
  primary key (community_id, content_type, content_id)
);
create index if not exists community_content_lookup_idx
  on public.community_content_links(content_type, content_id);
create index if not exists community_content_recent_idx
  on public.community_content_links(community_id, created_at desc);

alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_content_links enable row level security;

revoke all on table public.communities from public, anon, authenticated;
revoke all on table public.community_members from public, anon, authenticated;
revoke all on table public.community_content_links from public, anon, authenticated;

grant select, insert, update, delete on table public.communities to service_role;
grant select, insert, update, delete on table public.community_members to service_role;
grant select, insert, update, delete on table public.community_content_links to service_role;

insert into public.communities (id, slug, name, area, description, is_official)
values
  ('comm_pc_hardware', 'pc-hardware', 'PC & Hardware', 'Tecnologia', 'Montagem, compatibilidade, diagnóstico, upgrades, desempenho e manutenção de computadores.', true),
  ('comm_programacao', 'programacao', 'Programação', 'Tecnologia', 'Desenvolvimento de software, web, automação, ferramentas, estudos e projetos de código.', true),
  ('comm_dev_jogos', 'desenvolvimento-jogos', 'Desenvolvimento de Jogos', 'Tecnologia', 'Programação, design, prototipagem, ferramentas e projetos voltados à criação de jogos.', true),
  ('comm_eletronica', 'eletronica', 'Eletrônica', 'Tecnologia', 'Circuitos, componentes, reparos, medições, projetos e fundamentos de eletrônica.', true),
  ('comm_linux_redes', 'linux-redes', 'Linux & Redes', 'Tecnologia', 'Sistemas Linux, redes, servidores, diagnóstico, segurança e infraestrutura doméstica ou acadêmica.', true),
  ('comm_ia_automacao', 'ia-automacao', 'IA & Automação', 'Tecnologia', 'Inteligência artificial, automações, agentes, integrações e aplicações responsáveis.', true),
  ('comm_motos', 'motos', 'Motos', 'Automotivo', 'Manutenção, diagnóstico, projetos, peças, mecânica e conhecimento técnico sobre motocicletas.', true),
  ('comm_carros', 'carros', 'Carros', 'Automotivo', 'Manutenção, diagnóstico, projetos, peças, mecânica e conhecimento técnico sobre automóveis.', true),
  ('comm_mecanica', 'mecanica', 'Mecânica', 'Automotivo', 'Fundamentos mecânicos, manutenção preventiva, diagnóstico e práticas de oficina com segurança.', true),
  ('comm_matematica', 'matematica', 'Matemática', 'Acadêmico', 'Dúvidas, métodos de estudo, resolução comentada e discussão de conceitos matemáticos.', true),
  ('comm_ciencias_natureza', 'ciencias-natureza', 'Ciências da Natureza', 'Acadêmico', 'Biologia, Química, Física e conexões entre investigação científica e aprendizagem.', true),
  ('comm_pesquisa_cientifica', 'pesquisa-cientifica', 'Pesquisa Científica', 'Acadêmico', 'Metodologia, fontes, escrita, apresentação, revisão e desenvolvimento de pesquisas.', true),
  ('comm_educacao', 'educacao', 'Educação', 'Acadêmico', 'Ensino, aprendizagem, práticas pedagógicas, recursos didáticos e experiências educacionais.', true),
  ('comm_design_templates', 'design-templates', 'Design & Templates', 'Criação', 'Design acadêmico, apresentações, banners, modelos, organização visual e recursos reutilizáveis.', true),
  ('comm_literatura', 'literatura', 'Literatura', 'Leitura', 'Livros, leituras, autores, gêneros, clubes de leitura e discussão literária.', true)
on conflict (slug) do update
set
  name = excluded.name,
  area = excluded.area,
  description = excluded.description,
  is_official = true,
  status = 'active',
  updated_at = now();

-- Migração conservadora de conteúdo existente: somente correspondências inequívocas.
insert into public.community_content_links (community_id, content_type, content_id)
select c.id, 'discussion', d.id
from public.discussions d
join public.communities c
  on (
    lower(trim(d.category)) = lower(c.name)
    or (c.slug = 'matematica' and lower(trim(d.category)) in ('matematica', 'matemática'))
    or (c.slug = 'educacao' and lower(trim(d.category)) in ('educacao', 'educação'))
    or (c.slug = 'pesquisa-cientifica' and lower(trim(d.category)) in ('pesquisa', 'pesquisa cientifica', 'pesquisa científica'))
    or (c.slug = 'literatura' and lower(trim(d.category)) = 'literatura')
  )
on conflict do nothing;

insert into public.community_content_links (community_id, content_type, content_id)
select c.id, 'tech_resource', t.id
from public.tech_resources t
join public.communities c
  on (
    (c.slug = 'pc-hardware' and lower(trim(t.hub)) = 'pc & hardware')
    or (c.slug = 'motos' and lower(trim(t.hub)) = 'motos')
    or (c.slug = 'carros' and lower(trim(t.hub)) = 'carros')
    or (c.slug = 'desenvolvimento-jogos' and lower(trim(t.hub)) = 'jogos')
  )
on conflict do nothing;
