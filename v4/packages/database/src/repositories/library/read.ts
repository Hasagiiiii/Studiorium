import { bookReviewSchema, bookSchema, type Book, type BookReview } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

function mapBook(row: Record<string, unknown>): Book {
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

function mapReview(row: Record<string, unknown>): BookReview {
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

export async function listBookReviews(limit = 400): Promise<BookReview[]> {
  const result = await database()
    .from('book_reviews')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  return queryList(result).map((row) => mapReview(row as Record<string, unknown>));
}
