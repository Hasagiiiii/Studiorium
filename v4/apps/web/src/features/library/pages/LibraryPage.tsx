import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function LibraryPage() {
  const { data } = useAppState();
  const books = data?.books ?? [];

  return (
    <FeaturePage
      eyebrow="Biblioteca"
      title="Sua vida entre livros"
      description="Livros, estante pessoal, leituras, recomendações e reviews em um espaço exclusivo para livros."
    >
      <section className="resource-section">
        <header>
          <h2>Livros</h2>
        </header>
        <div className="resource-grid">
          {books.map((book) => (
            <article key={book.id} className="resource-card book-card">
              <span className="eyebrow">{book.category}</span>
              <h3>
                <Link to={`/livros/${encodeURIComponent(book.id)}`}>{book.title}</Link>
              </h3>
              <p>{book.author}</p>
            </article>
          ))}
        </div>
      </section>
    </FeaturePage>
  );
}
