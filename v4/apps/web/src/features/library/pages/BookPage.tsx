import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';

export function BookPage() {
  const { id = '' } = useParams();
  const { data } = useAppState();
  const book = data?.books.find((item) => item.id === id);
  const reviews = data?.bookReviews.filter((item) => item.bookId === id) ?? [];

  if (!book) {
    return (
      <main className="book-reading book-reading--missing" aria-labelledby="book-missing-title">
        <Link className="book-reading__back" to="/biblioteca">
          Voltar à biblioteca
        </Link>
        <section className="book-reading__empty">
          <span className="book-reading__eyebrow">Biblioteca</span>
          <h1 id="book-missing-title">Livro não encontrado</h1>
          <p>A obra pode ter sido removida do catálogo ou o endereço está incorreto.</p>
          <Link className="button secondary" to="/biblioteca">
            Explorar biblioteca
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="book-reading" aria-labelledby="book-reading-title">
      <Link className="book-reading__back" to="/biblioteca">
        Voltar à biblioteca
      </Link>

      <article className="book-reading__hero">
        <div className="book-reading__intro">
          <span className="book-reading__eyebrow">{book.category}</span>
          <h1 id="book-reading-title">{book.title}</h1>
          <p className="book-reading__author">por {book.author}</p>
          {book.description ? (
            <p className="book-reading__description">{book.description}</p>
          ) : null}

          {book.purchaseUrl ? (
            <a
              className="button secondary book-reading__purchase"
              href={book.purchaseUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              {book.purchaseLabel || 'Ver livro'}
            </a>
          ) : null}
        </div>

        <aside className="book-reading__signals" aria-label="Avaliação da comunidade">
          <div className="book-reading__rating">
            <strong>{book.ratingAverage.toFixed(1)}</strong>
            <span>de 5</span>
          </div>
          <dl className="book-reading__stats">
            <div>
              <dt>Reviews</dt>
              <dd>{book.reviewCount}</dd>
            </div>
            <div>
              <dt>Recomendações</dt>
              <dd>{book.recommendationCount}</dd>
            </div>
          </dl>
        </aside>
      </article>

      <section className="book-reading__reviews" aria-labelledby="book-reviews-title">
        <header className="book-reading__section-header">
          <div>
            <span className="book-reading__eyebrow">Comunidade</span>
            <h2 id="book-reviews-title">Reviews de leitores</h2>
          </div>
          <span>{reviews.length} nesta obra</span>
        </header>

        {reviews.length ? (
          <div className="book-reading__review-list">
            {reviews.map((review) => (
              <article key={review.userId} className="book-reading__review">
                <header>
                  <strong>{review.reviewerName}</strong>
                  <span aria-label={`Nota ${review.rating} de 5`}>{review.rating}/5</span>
                </header>
                {review.review ? (
                  <p>{review.review}</p>
                ) : (
                  <p className="muted">Sem comentário escrito.</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="book-reading__empty">
            <h3>Ainda sem reviews</h3>
            <p>Quando leitores avaliarem esta obra, as impressões aparecerão aqui.</p>
            <Link to="/biblioteca">Continuar explorando livros</Link>
          </div>
        )}
      </section>
    </main>
  );
}
