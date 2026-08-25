import { Link, useSearchParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeedSkeleton } from '../../../components/feedback/skeleton/Skeleton.js';
import { PostComposer } from '../../posts/components/PostComposer.js';
import { FeedCard } from '../components/FeedCard.js';
import { useFeed } from '../state/useFeed.js';
import { useProgressiveFeed } from '../state/useProgressiveFeed.js';

const tabs = [
  ['for-you', 'Para você'],
  ['following', 'Seguindo'],
  ['trending', 'Em alta'],
  ['recent', 'Recentes'],
] as const;

export function HomePage() {
  const [params] = useSearchParams();
  const { data } = useAppState();
  const { mode, entries, status, error, retry } = useFeed(params.get('feed'));
  const { visibleItems, hasMore, sentinelRef, loadMore } = useProgressiveFeed(entries, 8);

  return (
    <main id="main-content" className="social-home">
      <header className="social-stream-header">
        <div>
          <span className="eyebrow">Lorion</span>
          <h1>Início</h1>
          <p>Conhecimento, pessoas e comunidades em movimento.</p>
        </div>
        <Link className="social-discover-link" to="/explorar">
          Explorar
        </Link>
      </header>

      {data?.user ? (
        <section className="social-composer-shell" aria-label="Criar publicação">
          <PostComposer />
        </section>
      ) : (
        <section className="social-join-prompt">
          <div>
            <strong>Entre na conversa.</strong>
            <span>Siga pessoas, participe de comunidades e publique no Lorion.</span>
          </div>
          <Link className="button primary" to="/entrar">
            Entrar
          </Link>
        </section>
      )}

      <nav className="feed-tabs social-feed-tabs" aria-label="Filtros do feed">
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

      {status === 'loading' ? <FeedSkeleton cards={4} /> : null}

      {status === 'error' ? (
        <section className="empty-state feed-error" role="alert">
          <h2>Não foi possível atualizar sua timeline.</h2>
          <p>{error}</p>
          <button className="button secondary" type="button" onClick={retry}>
            Tentar novamente
          </button>
        </section>
      ) : null}

      {status === 'ready' ? (
        <section className="feed-list social-feed-list" aria-live="polite">
          {visibleItems.length ? (
            <>
              {visibleItems.map((entry, index) => (
                <FeedCard key={`${entry.type}:${entry.item.id}`} entry={entry} index={index % 8} />
              ))}
              {hasMore ? (
                <div ref={sentinelRef} className="feed-sentinel" aria-busy="true">
                  <FeedSkeleton cards={1} />
                  <button
                    className="button secondary feed-load-more"
                    type="button"
                    onClick={loadMore}
                  >
                    Carregar mais
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              <h2>Nada por aqui ainda.</h2>
              <p>
                {mode === 'following'
                  ? 'Siga pessoas para montar sua timeline.'
                  : 'A rede ainda não publicou conteúdo para este filtro.'}
              </p>
              {mode === 'following' ? (
                <Link to="/explorar?tipo=Pessoa">Encontrar pessoas</Link>
              ) : null}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
