-- Studiorium v2.9 — redação colaborativa, estúdio de templates e lixeira.

create table if not exists public.news_contributors (
  user_id text primary key references public.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  area text not null default '',
  institution text not null default '',
  portfolio_url text not null default '',
  statement text not null default '',
  reviewer_id text,
  review_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_articles (
  id text primary key,
  contributor_id text references public.users(id) on delete set null,
  author_name text not null,
  title text not null,
  slug text not null unique,
  summary text not null,
  body text not null,
  category text not null default 'Atualizações',
  sources jsonb not null default '[]'::jsonb
    check (jsonb_typeof(sources) = 'array'),
  status text not null default 'draft'
    check (
      status in (
        'draft',
        'ai_review',
        'editorial_review',
        'changes_requested',
        'published',
        'rejected',
        'archived'
      )
    ),
  ai_review_status text not null default 'pending'
    check (ai_review_status in ('pending', 'approved', 'flagged', 'unavailable')),
  ai_review jsonb not null default '{}'::jsonb,
  editorial_note text not null default '',
  featured boolean not null default false,
  certified_by text,
  certified_at timestamptz,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_articles_public_idx
  on public.news_articles(featured desc, published_at desc)
  where status = 'published' and certified_at is not null and deleted_at is null;
create index if not exists news_articles_contributor_idx
  on public.news_articles(contributor_id, updated_at desc);
create index if not exists news_articles_review_idx
  on public.news_articles(status, updated_at desc)
  where deleted_at is null;

create table if not exists public.custom_templates (
  id text primary key,
  owner_id text not null references public.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  document jsonb not null default '{"settings":{},"blocks":[]}'::jsonb
    check (jsonb_typeof(document) = 'object'),
  source_type text not null default 'editor'
    check (source_type in ('editor', 'imported_image', 'imported_pdf', 'imported_json')),
  status text not null default 'private'
    check (status in ('private', 'pending_review', 'published', 'rejected')),
  featured boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_templates_owner_idx
  on public.custom_templates(owner_id, updated_at desc);
create index if not exists custom_templates_public_idx
  on public.custom_templates(featured desc, updated_at desc)
  where status = 'published' and deleted_at is null;

alter table public.projects
  add column if not exists deleted_at timestamptz;
alter table public.code_projects
  add column if not exists deleted_at timestamptz;

alter table public.news_contributors enable row level security;
alter table public.news_articles enable row level security;
alter table public.custom_templates enable row level security;

revoke all on table public.news_contributors from public, anon, authenticated;
revoke all on table public.news_articles from public, anon, authenticated;
revoke all on table public.custom_templates from public, anon, authenticated;

grant select, insert, update, delete on table public.news_contributors to service_role;
grant select, insert, update, delete on table public.news_articles to service_role;
grant select, insert, update, delete on table public.custom_templates to service_role;

insert into storage.buckets (id, name, public, file_size_limit)
values ('template-assets', 'template-assets', false, 8388608)
on conflict (id) do update
set public = false,
    file_size_limit = 8388608;

insert into public.news_articles (
  id,
  author_name,
  title,
  slug,
  summary,
  body,
  category,
  sources,
  status,
  ai_review_status,
  ai_review,
  editorial_note,
  featured,
  certified_by,
  certified_at,
  published_at,
  created_at,
  updated_at
)
values
  (
    'news-redacao-studiorium',
    'Redação Studiorium',
    'Studiorium abre espaço para novos autores e estudantes de Jornalismo',
    'studiorium-abre-espaco-para-estudantes-de-jornalismo',
    'A nova redação colaborativa combina fontes declaradas, triagem por IA e revisão editorial humana.',
    'O Studiorium passa a receber propostas de matérias de estudantes de Jornalismo, ' ||
      'Comunicação e áreas relacionadas. O credenciamento do colaborador é analisado pela ' ||
      'administração. Cada texto precisa indicar suas fontes, passa por uma triagem automatizada ' ||
      'e só recebe o selo editorial depois da revisão humana. A IA auxilia na identificação de ' ||
      'riscos, mas não substitui a conferência das informações.',
    'Plataforma',
    '[{"title":"Sobre o Studiorium","url":"https://studiorium.vercel.app/sobre"}]'::jsonb,
    'published',
    'approved',
    '{"decision":"approved","origin":"initial-editorial-content"}'::jsonb,
    'Conteúdo institucional verificado.',
    true,
    'system',
    now(),
    now(),
    now(),
    now()
  ),
  (
    'news-fontes-confiaveis',
    'Redação Studiorium',
    'Por que uma notícia precisa mostrar de onde veio a informação',
    'por-que-noticia-precisa-mostrar-fontes',
    'Transparência sobre documentos, entrevistas e dados permite que o leitor confira o caminho da apuração.',
    'Uma matéria confiável diferencia fato, interpretação e opinião. Ao indicar documentos, ' ||
      'entrevistas, bases de dados e links originais, o autor permite que outras pessoas ' ||
      'compreendam como a informação foi apurada. No Studiorium, matérias colaborativas precisam ' ||
      'apresentar fontes antes de seguir para a revisão editorial.',
    'Jornalismo',
    '[{"title":"Diretrizes da comunidade","url":"https://studiorium.vercel.app/diretrizes"}]'::jsonb,
    'published',
    'approved',
    '{"decision":"approved","origin":"initial-editorial-content"}'::jsonb,
    'Conteúdo educativo verificado.',
    false,
    'system',
    now(),
    now(),
    now(),
    now()
  )
on conflict (id) do nothing;
