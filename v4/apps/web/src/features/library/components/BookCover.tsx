import { useEffect, useMemo, useState } from 'react';
import type { Book } from '@lorion/contracts';

type Props = {
  book: Book;
  size?: 'sm' | 'md' | 'lg';
};

function normalizedIsbn(isbn: string | null | undefined): string | null {
  const value = isbn?.replace(/[^0-9Xx]/g, '').toUpperCase();
  return value && (value.length === 10 || value.length === 13) ? value : null;
}

function coverSources(book: Book): string[] {
  const isbn = normalizedIsbn(book.isbn);
  return [
    book.coverUrl || '',
    isbn ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg?default=false` : '',
    isbn ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-M.jpg?default=false` : '',
  ].filter(Boolean);
}

export function BookCover({ book, size = 'md' }: Props) {
  const sources = useMemo(() => coverSources(book), [book]);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => setSourceIndex(0), [book.id, book.coverUrl, book.isbn]);

  const source = sources[sourceIndex] || null;
  if (!source) {
    return (
      <div className={`book-cover book-cover-${size} book-cover-placeholder`} aria-label={`Capa de ${book.title}`}>
        <span>{book.title.slice(0, 1).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <img
      className={`book-cover book-cover-${size}`}
      src={source}
      alt={`Capa de ${book.title}`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setSourceIndex((current) => current + 1)}
    />
  );
}
