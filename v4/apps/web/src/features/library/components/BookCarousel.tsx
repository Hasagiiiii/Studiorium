import { useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Book } from '@lorion/contracts';
import { BookCover } from './BookCover.js';

type BookCarouselItem = {
  book: Book;
  label?: string;
};

type Props = {
  title: string;
  items: BookCarouselItem[];
  ariaLabel?: string;
};

export function BookCarousel({ title, items, ariaLabel = title }: Props) {
  const railRef = useRef<HTMLDivElement | null>(null);

  function scroll(direction: -1 | 1) {
    railRef.current?.scrollBy({
      left: direction * Math.max(280, railRef.current.clientWidth * 0.78),
      behavior: 'smooth',
    });
  }

  if (!items.length) return null;

  return (
    <section className="book-carousel" aria-label={ariaLabel}>
      <header className="book-carousel-heading">
        <div>
          <h2>{title}</h2>
          <span>{items.length} {items.length === 1 ? 'livro' : 'livros'}</span>
        </div>
        <div className="book-carousel-controls" aria-label={`Navegar em ${title}`}>
          <button type="button" aria-label="Livros anteriores" onClick={() => scroll(-1)}>
            ‹
          </button>
          <button type="button" aria-label="Próximos livros" onClick={() => scroll(1)}>
            ›
          </button>
        </div>
      </header>

      <div ref={railRef} className="book-rail" tabIndex={0}>
        {items.map(({ book, label }) => (
          <article key={book.id} className="book-tile">
            <Link className="book-cover-link" to={`/livros/${encodeURIComponent(book.id)}`}>
              <BookCover book={book} />
            </Link>
            <div className="book-tile-copy">
              {label ? <span className="book-shelf-label">{label}</span> : null}
              <h3>
                <Link to={`/livros/${encodeURIComponent(book.id)}`}>{book.title}</Link>
              </h3>
              <p>{book.author}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
