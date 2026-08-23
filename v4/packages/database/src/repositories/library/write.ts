import type { BookShelfStatus, CreateBookInput, ReviewBookInput } from '@lorion/contracts';
import { database } from '../../core/client.js';

export async function saveBookToShelf(userId: string, bookId: string, shelfStatus: BookShelfStatus) {
  const result = await database()
    .from('book_saves')
    .upsert(
      { user_id: userId, book_id: bookId, shelf_status: shelfStatus },
      { onConflict: 'user_id,book_id' },
    )
    .select('book_id,shelf_status,created_at')
    .single();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function removeBookFromShelf(userId: string, bookId: string): Promise<boolean> {
  const result = await database()
    .from('book_saves')
    .delete()
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .select('book_id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function saveBookReviewAtomic(
  userId: string,
  reviewerName: string,
  bookId: string,
  input: ReviewBookInput,
): Promise<boolean> {
  const result = await database().rpc('save_book_review', {
    p_book_id: bookId,
    p_user_id: userId,
    p_reviewer_name: reviewerName,
    p_rating: input.rating,
    p_review: input.review,
    p_recommend: input.recommend,
  });
  if (result.error) throw new Error(result.error.message);
  return result.data === true;
}

export async function createBookWithReviewAtomic(
  bookId: string,
  userId: string,
  reviewerName: string,
  input: CreateBookInput,
  normalized: { isbn: string; coverUrl: string; purchaseUrl: string; purchaseLabel: string },
): Promise<string | null> {
  const result = await database().rpc('create_book_with_review', {
    p_book_id: bookId,
    p_user_id: userId,
    p_title: input.title,
    p_author: input.author,
    p_description: input.description,
    p_category: input.category || 'Leituras da comunidade',
    p_isbn: normalized.isbn,
    p_cover_url: normalized.coverUrl,
    p_purchase_url: normalized.purchaseUrl,
    p_purchase_label: normalized.purchaseLabel,
    p_reviewer_name: reviewerName,
    p_rating: input.rating,
    p_review: input.review,
    p_recommend: input.recommend,
  });
  if (result.error) throw new Error(result.error.message);
  return typeof result.data === 'string' && result.data ? result.data : null;
}
