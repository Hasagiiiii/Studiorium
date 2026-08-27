import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { buildSearchIndex, searchEntries, type SearchEntry } from '../../search/lib/searchIndex.js';

const TYPES: SearchEntry['type'][] = [
  'Pessoa',
  'Comunidade',
  'Livro',
  'Publicação',
  'Pesquisa',
  'Projeto',
  'Discussão',
  'Notícia',
];

function initials(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function ExplorePage() {
  const { data } = useAppState();
  const [params, setParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const query = params.get('q')?.trim() || '';
  const requestedType = params.get('tipo') || '';
  const selectedType = TYPES.includes(requestedType as SearchEntry['type'])
    ? (requestedType as SearchEntry['type'])
    : null;
  const [value, setValue] = useState(query);

  useEffect(() => setValue(query), [query]);

  useEffect(() => {
    if (params.get('foco') !== 'busca') return;
    inputRef.current?.focus({ preventScroll: false });
    const next = new URLSearchParams(params);
    next.delete('foco');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const entries = useMemo(() => (data ? buildSearchIndex(data) : []), [data]);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        TYPES.map((type) => [type, entries.filter((entry) => entry.type === type).length]),
      ) as Record<SearchEntry['type'], number>,
    [entries],
  );

  const searched = useMemo(
    () => (query ? searchEntries(entries, query) : entries),
    [entries, query],
  );
  const visibleEntries = useMemo(() => {
    const filtered = selectedType
      ? searched.filter((entry) => entry.type === selectedType)
      : searched;
    return filtered.slice(0, query || selectedType ? 50 : 24);
  }, [searched, query, selectedType]);

  const people = useMemo(
    () => searched.filter((entry) => entry.type === 'Pessoa').slice(0, 8),
    [searched],
  );
  const communities = useMemo(
    () => searched.filter((entry) => entry.type === 'Comunidade').slice(0, 8),
    [searched],
  );
  const content = useMemo(
    () => visibleEntries.filter((entry) => entry.type !== 'Pessoa' && entry.type !== 'Comunidade'),
    [visibleEntries],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    next.delete('foco');
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
    <main id="main-content" className="social-explore-page">
      <header className="social-explore-header">
        <div>
          <span className="eyebrow">Descoberta</span>
          <h1>Explorar</h1>
        </div>
        <form className="global-search social-explore-search" onSubmit={submit} role="search">
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Pesquisar pessoas, comunidades e conteúdo"
            aria-label="Pesquisar no Lorion"
          />
          <button type="submit" className="button primary">
            Pesquisar
          </button>
        </form>
      </header>

      <nav className="explore-filters social-explore-filters" aria-label="Filtrar descoberta">
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

      {!selectedType || selectedType === 'Pessoa' ? (
        <section className="social-discovery-section">
          <header>
            <h2>{query ? 'Pessoas encontradas' : 'Pessoas para descobrir'}</h2>
          </header>
          {people.length ? (
            <div className="social-person-strip">
              {people.map((entry) => (
                <article key={entry.id} className="social-person-card">
                  <div className="social-person-avatar" aria-hidden="true">
                    {initials(entry.title)}
                  </div>
                  <h3>
                    <Link to={entry.href}>{entry.title}</Link>
                  </h3>
                  <p>{entry.description}</p>
                  <Link className="button secondary" to={entry.href}>
                    Ver perfil
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Nenhuma pessoa encontrada.</p>
            </div>
          )}
        </section>
      ) : null}

      {!selectedType || selectedType === 'Comunidade' ? (
        <section className="social-discovery-section">
          <header>
            <h2>{query ? 'Comunidades encontradas' : 'Comunidades em destaque'}</h2>
          </header>
          {communities.length ? (
            <div className="social-community-strip">
              {communities.map((entry) => (
                <article key={entry.id} className="social-community-card">
                  <span className="eyebrow">Comunidade</span>
                  <h3>
                    <Link to={entry.href}>{entry.title}</Link>
                  </h3>
                  <p>{entry.description}</p>
                  <Link to={entry.href}>Abrir comunidade</Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Nenhuma comunidade encontrada.</p>
            </div>
          )}
        </section>
      ) : null}

      {selectedType === 'Pessoa' || selectedType === 'Comunidade' ? null : (
        <section className="social-discovery-section search-results" aria-live="polite">
          <header>
            <h2>
              {query
                ? `Resultados para “${query}”`
                : selectedType
                  ? selectedType
                  : 'Conteúdo para você explorar'}
            </h2>
            <span>{content.length} itens</span>
          </header>
          {content.length ? (
            <div className="social-explore-grid">
              {content.map((entry) => (
                <article
                  key={entry.id}
                  className={`social-explore-card explore-${entry.type.toLowerCase()}`}
                >
                  <span className="eyebrow">{entry.type}</span>
                  <h2>
                    <Link to={entry.href}>{entry.title}</Link>
                  </h2>
                  <p>{entry.description}</p>
                  <Link className="social-explore-open" to={entry.href}>
                    Abrir
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>Nenhum resultado encontrado.</h2>
              <p>Tente outro termo ou remova o filtro atual.</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
