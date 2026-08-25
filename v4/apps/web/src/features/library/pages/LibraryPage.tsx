import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { BookCover } from '../components/BookCover.js';

export function LibraryPage() {
  const { data } = useAppState();
  const books = data?.books ?? [];

  return (
    <FeaturePage
      eyebrow="Biblioteca"
      title="Livros no Lorion"
      description="Descubra livros e leia as avaliações publicadas pela comunidade."
    >
      <section className="resource-section">
        <header>
          <h2>Livros</h2>
        </header>
        {books.length ? (
          <div className="book-rail" aria-label="Livros disponíveis">
            {books.map((book) => (
              <article key={book.id} className="book-tile">
                <Link className="book-cover-link" to={`/livros/${encodeURIComponent(book.id)}`}>
                  <BookCover book={book} />
                </Link>
                <div className="book-tile-copy">
                  <span className="eyebrow">{book.category}</span>
                  <h3>
                    <Link to={`/livros/${encodeURIComponent(book.id)}`}>{book.title}</Link>
                  </h3>
                  <p>{book.author}</p>
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
