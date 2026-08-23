import {
  bookReviewSchema,
  bookSaveSchema,
  bookSchema,
  profileBookshelfItemSchema,
  type Book,
  type BookReview,
  type BookSave,
  type ProfileBookshelfItem,
} from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

export function mapBook(row: Record<string, unknown>): Book {
  return bookSchema.parse({
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description,
    category: row.category,
    coverTheme: row.cover_theme,
    featured: row.featured,
    submittedBy: row.submitted_by,
    isbn: row.isbn,
    coverUrl: row.cover_url,
    purchaseUrl: row.purchase_url,
    purchaseLabel: row.purchase_label,
    ratingAverage: Number(row.rating_average || 0),
    reviewCount: Number(row.review_count || 0),
    recommendationCount: Number(row.recommendation_count || 0),
    createdAt: row.created_at,
  });
}

export function mapReview(row: Record<string, unknown>): BookReview {
  return bookReviewSchema.parse({
    bookId: row.book_id,
    userId: row.user_id,
    reviewerName: row.reviewer_name,
    rating: Number(row.rating),
    review: row.review,
    recommend: row.recommend,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function listBooks(): Promise<Book[]> {
  const result = await database()
    .from('books')
    .select('*')
    .order('recommendation_count', { ascending: false })
    .order('rating_average', { ascending: false })
    .order('created_at', { ascending: false });

  return queryList(result).map((row) => mapBook(row as Record<string, unknown>));
}

export async function findBookById(bookId: string): Promise<Book | null> {
  const result = await database().from('books').select('*').eq('id', bookId).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapBook(result.data as Record<string, unknown>) : null;
}

export async function findBookByTitleAuthor(title: string, author: string): Promise<Book | null> {
  const result = await database()
    .from('books')
    .select('*')
    .ilike('title', title)
    .ilike('author', author)
    .limit(1)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapBook(result.data as Record<string, unknown>) : null;
}

export async function listBookReviews(limit = 400): Promise<BookReview[]> {
  const result = await database()
    .from('book_reviews')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  return queryList(result).map((row) => mapReview(row as Record<string, unknown>));
}

export async function listReviewsForBook(bookId: string): Promise<BookReview[]> {
  const result = await database()
    .from('book_reviews')
    .select('*')
    .eq('book_id', bookId)
    .order('updated_at', { ascending: false })
    .limit(300);
  return queryList(result).map((row) => mapReview(row as Record<string, unknown>));
}

export async function findBookReview(bookId: string, userId: string): Promise<BookReview | null> {
  const result = await database()
    .from('book_reviews')
    .select('*')
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapReview(result.data as Record<string, unknown>) : null;
}

export async function findBookSave(bookId: string, userId: string): Promise<BookSave | null> {
  const result = await database()
    .from('book_saves')
    .select('book_id,shelf_status,created_at')
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data
    ? bookSaveSchema.parse({
        bookId: result.data.book_id,
        shelfStatus: result.data.shelf_status,
        savedAt: result.data.created_at,
      })
    : null;
}

export async function listProfileBookshelf(userId: string): Promise<ProfileBookshelfItem[]> {
  const saves = queryList(
    await database()
      .from('book_saves')
      .select('book_id,shelf_status,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ) as Array<{ book_id: string; shelf_status: string; created_at: string | null }>;

  if (!saves.length) return [];

  const books = queryList(
    await database()
      .from('books')
      .select('*')
      .in(
        'id',
        saves.map((save) => save.book_id),
      ),
  );
  const bookById = new Map(
    books.map((row) => {
      const book = mapBook(row as Record<string, unknown>);
      return [book.id, book] as const;
    }),
  );

  return saves.flatMap((save) => {
    const book = bookById.get(save.book_id);
    if (!book) return [];
    return [
      profileBookshelfItemSchema.parse({
        book,
        shelfStatus: save.shelf_status,
        savedAt: save.created_at,
      }),
    ];
  });
}
