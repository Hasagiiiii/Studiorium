import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function BookPage() {
  const { id = '' } = useParams();
  const { data } = useAppState();
  const book = data?.books.find((item) => item.id === id);
  const reviews = data?.bookReviews.filter((item) => item.bookId === id) ?? [];

  if (!book) {
    return (
      <FeaturePage
        eyebrow="Biblioteca"
        title="Livro não encontrado"
        description="A obra pode ter sido removida do catálogo ou o endereço está incorreto."
      >
        <Link to="/biblioteca">Voltar à biblioteca</Link>
      </FeaturePage>
    );
  }

  return (
    <FeaturePage eyebrow={book.category} title={book.title} description={book.author}>
      <article className="book-detail">
        {book.description ? <p>{book.description}</p> : null}
        <div className="book-meta">
          <span>
            <strong>{book.ratingAverage.toFixed(1)}</strong> / 5
          </span>
          <span>{book.reviewCount} reviews</span>
          <span>{book.recommendationCount} recomendações</span>
        </div>
        {book.purchaseUrl ? (
          <a
            className="button secondary"
            href={book.purchaseUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            {book.purchaseLabel || 'Ver livro'}
          </a>
        ) : null}
      </article>

      <section className="resource-section">
        <header>
          <h2>Reviews da comunidade</h2>
        </header>
        {reviews.length ? (
          <div className="resource-grid">
            {reviews.map((review) => (
              <article key={review.userId} className="resource-card">
                <strong>{review.reviewerName}</strong>
                <span>{review.rating}/5</span>
                {review.review ? <p>{review.review}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Ainda não há reviews para esta obra.</p>
          </div>
        )}
      </section>
    </FeaturePage>
  );
}
