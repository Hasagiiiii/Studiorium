import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { BookCarousel } from '../components/BookCarousel.js';

export function LibraryPage() {
  const { data } = useAppState();
  const books = data?.books ?? [];

  const featured = books.filter((book) => book.featured);
  const rated = [...books]
    .filter((book) => book.reviewCount > 0)
    .sort((a, b) => b.ratingAverage - a.ratingAverage)
    .slice(0, 16);

  return (
    <FeaturePage
      eyebrow="Biblioteca"
      title="Sua próxima leitura começa aqui"
      description="Explore capas, avaliações e recomendações da comunidade."
    >
      {books.length ? (
        <div className="library-shelves">
          {featured.length ? (
            <BookCarousel
              title="Destaques"
              items={featured.map((book) => ({ book, label: book.category }))}
            />
          ) : null}

          <BookCarousel
            title={featured.length ? 'Todos os livros' : 'Livros'}
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
        <div className="empty-state">
          <p>Nenhum livro está disponível no catálogo neste momento.</p>
        </div>
      )}
    </FeaturePage>
  );
}
