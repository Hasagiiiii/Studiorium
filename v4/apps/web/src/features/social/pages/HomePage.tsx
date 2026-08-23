import { Link, useSearchParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeedCard } from '../components/FeedCard.js';
import { useFeed } from '../state/useFeed.js';

const tabs = [
  ['for-you', 'Para você'],
  ['following', 'Seguindo'],
  ['trending', 'Em alta'],
  ['recent', 'Recentes'],
] as const;

export function HomePage() {
  const [params] = useSearchParams();
  const { data } = useAppState();
  const { mode, entries, status, error } = useFeed(params.get('feed'));

  return (
    <main id="main-content" className="social-home">
      <header className="social-home-heading">
        <span className="eyebrow">Lorion</span>
        <h1>Conhecimento conecta.</h1>
        <p>Pessoas, projetos, pesquisas e comunidades na mesma rede.</p>
      </header>

      <nav className="feed-tabs" aria-label="Filtros do feed">
        {tabs
          .filter(([value]) => value !== 'following' || data?.user)
          .map(([value, label]) => (
            <Link
              key={value}
              className={mode === value ? 'active' : ''}
              to={value === 'for-you' ? '/' : `/?feed=${value}`}
            >
              {label}
            </Link>
          ))}
      </nav>

      {status === 'loading' ? <p className="feed-status">Carregando sua timeline…</p> : null}
      {status === 'error' ? <p className="feed-status error">{error}</p> : null}

      <section className="feed-list" aria-live="polite">
        {entries.length ? (
          entries.map((entry) => <FeedCard key={`${entry.type}:${entry.item.id}`} entry={entry} />)
        ) : (
          <div className="empty-state">
            <h2>Nada por aqui ainda.</h2>
            <p>
              {mode === 'following'
                ? 'Siga pessoas para montar sua timeline.'
                : 'A comunidade ainda não publicou conteúdo para este filtro.'}
            </p>
            {mode === 'following' ? (
              <Link to="/explorar?tipo=Pessoa">Encontrar pessoas</Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
