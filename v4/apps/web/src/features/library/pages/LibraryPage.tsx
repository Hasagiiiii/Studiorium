import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { BookCarousel } from '../components/BookCarousel.js';

export function LibraryPage() {
  const { data } = useAppState();
  const books = data?.books ?? [];

  const featured = books.filter((book) => book.featured);
  const rated = [...books]
    .filter((book) => book.reviewCount > 0)
    .sort((a, b) => b.ratingAverage - a.ratingAverage)
    .slice(0, 16);
  const categories = [...new Set(books.map((book) => book.category).filter(Boolean))].slice(0, 6);
  const reviewedCount = books.filter((book) => book.reviewCount > 0).length;

  return (
    <main className="library-page" aria-labelledby="library-title">
      <header className="library-hero">
        <div className="library-hero-copy">
          <span className="library-eyebrow">Biblioteca</span>
          <h1 id="library-title">Encontre sua próxima leitura</h1>
          <p>
            Descubra livros pelo catálogo, pelos destaques e pelas avaliações feitas pela
            comunidade.
          </p>
        </div>

        {books.length ? (
          <dl className="library-stats" aria-label="Resumo do catálogo">
            <div>
              <dt>Catálogo</dt>
              <dd>{books.length}</dd>
            </div>
            <div>
              <dt>Avaliados</dt>
              <dd>{reviewedCount}</dd>
            </div>
            <div>
              <dt>Categorias</dt>
              <dd>{new Set(books.map((book) => book.category)).size}</dd>
            </div>
          </dl>
        ) : null}
      </header>

      {categories.length ? (
        <nav className="library-category-strip" aria-label="Categorias em destaque">
          {categories.map((category) => (
            <span key={category}>{category}</span>
          ))}
        </nav>
      ) : null}

      {books.length ? (
        <div className="library-shelves">
          {featured.length ? (
            <BookCarousel
              title="Destaques"
              items={featured.map((book) => ({ book, label: book.category }))}
            />
          ) : null}

          <BookCarousel
            title={featured.length ? 'Todo o catálogo' : 'Livros'}
            items={books.map((book) => ({ book, label: book.category }))}
          />

          {rated.length > 1 ? (
            <BookCarousel
              title="Bem avaliados"
              items={rated.map((book) => ({
                book,
                label: `${book.ratingAverage.toFixed(1)} ★`,
              }))}
            />
          ) : null}
        </div>
      ) : (
        <section className="library-empty" aria-labelledby="library-empty-title">
          <span aria-hidden="true">⌑</span>
          <div>
            <h2 id="library-empty-title">O catálogo está em preparação</h2>
            <p>
              Ainda não há livros disponíveis aqui. Enquanto isso, explore pessoas, comunidades e
              publicações do Studiorium.
            </p>
          </div>
          <Link className="secondary-action" to="/explorar">
            Ir para Explorar
          </Link>
        </section>
      )}
    </main>
  );
}
