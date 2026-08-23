import { FormEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { buildSearchIndex, searchEntries } from '../lib/searchIndex.js';

export function SearchPage() {
  const { data } = useAppState();
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get('q') || '';
  const [value, setValue] = useState(initialQuery);
  const entries = useMemo(() => (data ? buildSearchIndex(data) : []), [data]);
  const results = useMemo(() => searchEntries(entries, initialQuery), [entries, initialQuery]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = value.trim();
    setParams(query ? { q: query } : {});
  }

  return (
    <FeaturePage
      eyebrow="Busca global"
      title="Encontre qualquer coisa no Lorion"
      description="Pessoas, comunidades, livros, pesquisas, projetos, Oficina e notícias em uma busca única."
    >
      <form className="global-search" onSubmit={submit} role="search">
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Pesquisar no Lorion…"
          aria-label="Pesquisar no Lorion"
        />
        <button type="submit" className="button primary">Pesquisar</button>
      </form>

      {initialQuery ? (
        <section className="search-results" aria-live="polite">
          <header><strong>{results.length}</strong> resultados para “{initialQuery}”</header>
          <div className="resource-grid">
            {results.map((entry) => (
              <article key={entry.id} className="resource-card search-result-card">
                <span className="eyebrow">{entry.type}</span>
                <h2><Link to={entry.href}>{entry.title}</Link></h2>
                <p>{entry.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </FeaturePage>
  );
}
