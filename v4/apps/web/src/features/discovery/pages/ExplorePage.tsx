import { useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { buildSearchIndex, searchEntries, type SearchEntry } from '../../search/lib/searchIndex.js';

const TYPES: SearchEntry['type'][] = [
  'Pessoa',
  'Comunidade',
  'Livro',
  'Pesquisa',
  'Projeto',
  'Discussão',
  'Notícia',
];

export function ExplorePage() {
  const { data } = useAppState();
  const [params, setParams] = useSearchParams();
  const query = params.get('q')?.trim() || '';
  const requestedType = params.get('tipo') || '';
  const selectedType = TYPES.includes(requestedType as SearchEntry['type'])
    ? (requestedType as SearchEntry['type'])
    : null;
  const [value, setValue] = useState(query);

  const entries = useMemo(() => (data ? buildSearchIndex(data) : []), [data]);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        TYPES.map((type) => [type, entries.filter((entry) => entry.type === type).length]),
      ) as Record<SearchEntry['type'], number>,
    [entries],
  );

  const visibleEntries = useMemo(() => {
    const searched = query ? searchEntries(entries, query) : entries;
    const filtered = selectedType
      ? searched.filter((entry) => entry.type === selectedType)
      : searched;
    return filtered.slice(0, query || selectedType ? 50 : 18);
  }, [entries, query, selectedType]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    const nextQuery = value.trim();
    if (nextQuery) next.set('q', nextQuery);
    else next.delete('q');
    setParams(next);
  }

  function categoryHref(type: SearchEntry['type']) {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    next.set('tipo', type);
    return `/explorar?${next.toString()}`;
  }

  return (
    <FeaturePage
      eyebrow="Explorar"
      title="Descubra pessoas e conhecimento"
      description="Busca e descoberta vivem no mesmo lugar. Pessoas, discussões e notícias são tipos de resultado, não abas paralelas."
    >
      <form className="global-search" onSubmit={submit} role="search">
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Pesquisar pessoas, comunidades, livros, pesquisas, projetos, discussões e notícias…"
          aria-label="Pesquisar no Lorion"
        />
        <button type="submit" className="button primary">
          Pesquisar
        </button>
      </form>

      <nav className="explore-filters" aria-label="Filtrar descoberta">
        <Link
          className={!selectedType ? 'active' : ''}
          to={query ? `/explorar?q=${encodeURIComponent(query)}` : '/explorar'}
        >
          Tudo <span>{entries.length}</span>
        </Link>
        {TYPES.map((type) => (
          <Link
            key={type}
            className={selectedType === type ? 'active' : ''}
            to={categoryHref(type)}
          >
            {type} <span>{counts[type]}</span>
          </Link>
        ))}
      </nav>

      <section className="search-results" aria-live="polite">
        <header>
          <strong>{visibleEntries.length}</strong>{' '}
          {query
            ? `resultados para “${query}”`
            : selectedType
              ? `itens em ${selectedType}`
              : 'destaques para explorar'}
        </header>
        <div className="resource-grid">
          {visibleEntries.map((entry) => (
            <article key={entry.id} className="resource-card search-result-card">
              <span className="eyebrow">{entry.type}</span>
              <h2>
                <Link to={entry.href}>{entry.title}</Link>
              </h2>
              <p>{entry.description}</p>
            </article>
          ))}
        </div>
      </section>
    </FeaturePage>
  );
}
