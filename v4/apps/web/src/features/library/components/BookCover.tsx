import { useMemo, useState } from 'react';
import type { Book } from '@lorion/contracts';

type Props = {
  book: Book;
  size?: 'sm' | 'md' | 'lg';
};

function isbnCover(isbn: string | null | undefined): string | null {
  const normalized = isbn?.replace(/[^0-9Xx]/g, '');
  if (!normalized) return null;
  return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(normalized)}-L.jpg?default=false`;
}

export function BookCover({ book, size = 'md' }: Props) {
  const [failed, setFailed] = useState(false);
  const source = useMemo(() => book.coverUrl || isbnCover(book.isbn), [book.coverUrl, book.isbn]);

  if (!source || failed) {
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
      onError={() => setFailed(true)}
    />
  );
}
