import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { RecommendBookForm } from '../components/RecommendBookForm.js';

export function LibraryPage() {
  const { data } = useAppState();
  const books = data?.books ?? [];

  return (
    <FeaturePage
      eyebrow="Biblioteca"
      title="Livros no Lorion"
      description="Descubra obras, organize sua estante, publique reviews e compartilhe recomendações com a comunidade."
    >
      <RecommendBookForm />

      <section className="resource-section">
        <header>
          <h2>Livros</h2>
        </header>
        {books.length ? (
          <div className="resource-grid">
            {books.map((book) => (
              <article key={book.id} className="resource-card book-card">
                {book.coverUrl ? <img className="book-cover" src={book.coverUrl} alt="" loading="lazy" /> : null}
                <span className="eyebrow">{book.category}</span>
                <h3>
                  <Link to={`/livros/${encodeURIComponent(book.id)}`}>{book.title}</Link>
                </h3>
                <p>{book.author}</p>
                <div className="book-meta">
                  <span>{book.ratingAverage.toFixed(1)}/5</span>
                  <span>{book.reviewCount} reviews</span>
                  <span>{book.recommendationCount} recomendações</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Nenhum livro está disponível no catálogo neste momento.</p>
          </div>
        )}
      </section>
    </FeaturePage>
  );
}
