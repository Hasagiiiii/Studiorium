import type { BootstrapPayload } from '@lorion/contracts';

export type SearchEntry = {
  id: string;
  type: 'Pessoa' | 'Comunidade' | 'Livro' | 'Pesquisa' | 'Projeto' | 'Notícia';
  title: string;
  description: string;
  href: string;
  searchable: string;
};

function normalize(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function buildSearchIndex(data: BootstrapPayload): SearchEntry[] {
  return [
    ...data.profiles.map((item) => ({
      id: `profile:${item.userId}`,
      type: 'Pessoa' as const,
      title: item.displayName,
      description: item.bio || item.verifiedSpecialty || item.profileType,
      href: `/perfil/${encodeURIComponent(item.username)}`,
      searchable: normalize([item.displayName, item.bio, item.verifiedSpecialty, item.institution].join(' ')),
    })),
    ...data.communities.map((item) => ({
      id: `community:${item.id}`,
      type: 'Comunidade' as const,
      title: item.name,
      description: item.description,
      href: `/comunidades/${encodeURIComponent(item.slug)}`,
      searchable: normalize([item.name, item.area, item.description].join(' ')),
    })),
    ...data.books.map((item) => ({
      id: `book:${item.id}`,
      type: 'Livro' as const,
      title: item.title,
      description: item.author,
      href: `/livros/${encodeURIComponent(item.id)}`,
      searchable: normalize([item.title, item.author, item.category, item.description].join(' ')),
    })),
    ...data.publications.map((item) => ({
      id: `research:${item.id}`,
      type: 'Pesquisa' as const,
      title: item.title,
      description: item.abstract,
      href: `/pesquisas/${encodeURIComponent(item.slug)}`,
      searchable: normalize([item.title, item.abstract, item.area, item.keywords.join(' ')].join(' ')),
    })),
    ...data.communityProjects.map((item) => ({
      id: `project:${item.id}`,
      type: 'Projeto' as const,
      title: item.title,
      description: item.notes,
      href: `/projetos/${encodeURIComponent(item.id)}`,
      searchable: normalize([item.title, item.type, item.notes].join(' ')),
    })),
    ...data.news.map((item) => ({
      id: `news:${item.id}`,
      type: 'Notícia' as const,
      title: item.title,
      description: item.summary,
      href: `/noticias/${encodeURIComponent(item.slug)}`,
      searchable: normalize([item.title, item.summary, item.category].join(' ')),
    })),
  ];
}

export function searchEntries(entries: readonly SearchEntry[], query: string): SearchEntry[] {
  const normalizedQuery = normalize(query).trim();
  if (!normalizedQuery) return [];
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  return entries
    .filter((entry) => terms.every((term) => entry.searchable.includes(term)))
    .slice(0, 50);
}
