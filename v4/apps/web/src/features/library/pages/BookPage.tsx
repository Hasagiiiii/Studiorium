import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { BookDetail } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { BookCommunityActions } from '../components/BookCommunityActions.js';

type State =
  | { status: 'loading'; value: BookDetail | null; error: null }
  | { status: 'ready'; value: BookDetail; error: null }
  | { status: 'error'; value: BookDetail | null; error: string };

export function BookPage() {
  const { id = '' } = useParams();
  const [state, setState] = useState<State>({ status: 'loading', value: null, error: null });

  const load = useCallback(async () => {
    if (!id) return;
    setState({ status: 'loading', value: null, error: null });
    try {
      const value = await services.library.detail(id);
      setState({ status: 'ready', value, error: null });
    } catch (cause) {
      setState({
        status: 'error',
        value: null,
        error: cause instanceof Error ? cause.message : 'Não foi possível carregar o livro.',
      });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'loading') {
    return <FeaturePage eyebrow="Biblioteca" title="Carregando livro…" description="Buscando obra, reviews e sua estante." />;
  }

  if (state.status === 'error' || !state.value) {
    return (
      <FeaturePage eyebrow="Biblioteca" title="Livro não encontrado" description={state.error || 'A obra pode ter sido removida do catálogo.'}>
        <Link to="/biblioteca">Voltar à biblioteca</Link>
      </FeaturePage>
    );
  }

  const { book, reviews } = state.value;

  return (
    <FeaturePage eyebrow={book.category} title={book.title} description={book.author}>
      <article className="book-detail">
        {book.coverUrl ? <img className="book-detail-cover" src={book.coverUrl} alt={`Capa de ${book.title}`} /> : null}
        <div>
          {book.description ? <p>{book.description}</p> : null}
          <div className="book-meta">
            <span><strong>{book.ratingAverage.toFixed(1)}</strong> / 5</span>
            <span>{book.reviewCount} reviews</span>
            <span>{book.recommendationCount} recomendações</span>
          </div>
          {book.purchaseUrl ? (
            <a className="button secondary" href={book.purchaseUrl} target="_blank" rel="noreferrer noopener sponsored">
              {book.purchaseLabel || 'Ver livro'}
            </a>
          ) : null}
        </div>
      </article>

      <BookCommunityActions detail={state.value} onChanged={load} />

      <section className="resource-section">
        <header><h2>Reviews da comunidade</h2></header>
        {reviews.length ? (
          <div className="resource-grid">
            {reviews.map((review) => (
              <article key={review.userId} className="resource-card">
                <strong>{review.reviewerName}</strong>
                <span>{review.rating}/5</span>
                {review.recommend ? <span>Recomenda</span> : <span>Não recomenda</span>}
                {review.review ? <p>{review.review}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><p>Ainda não há reviews para esta obra.</p></div>
        )}
      </section>
    </FeaturePage>
  );
}
