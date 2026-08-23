import {
  bookDetailSchema,
  bookReviewMutationSchema,
  bookSaveSchema,
  createBookResultSchema,
  removeBookResultSchema,
  type BookDetail,
  type BookReviewMutation,
  type BookSave,
  type CreateBookInput,
  type CreateBookResult,
  type RemoveBookResult,
  type ReviewBookInput,
  type SaveBookInput,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class LibraryService {
  constructor(private readonly client: ApiClient) {}

  detail(bookId: string): Promise<BookDetail> {
    return this.client.request(`/api/v4/books/${encodeURIComponent(bookId)}`, bookDetailSchema);
  }

  save(bookId: string, input: SaveBookInput): Promise<BookSave> {
    return this.client.request(`/api/v4/books/${encodeURIComponent(bookId)}/shelf`, bookSaveSchema, {
      method: 'PUT',
      body: input,
    });
  }

  remove(bookId: string): Promise<RemoveBookResult> {
    return this.client.request(
      `/api/v4/books/${encodeURIComponent(bookId)}/shelf`,
      removeBookResultSchema,
      { method: 'DELETE' },
    );
  }

  review(bookId: string, input: ReviewBookInput): Promise<BookReviewMutation> {
    return this.client.request(
      `/api/v4/books/${encodeURIComponent(bookId)}/review`,
      bookReviewMutationSchema,
      { method: 'PUT', body: input },
    );
  }

  create(input: CreateBookInput): Promise<CreateBookResult> {
    return this.client.request('/api/v4/books', createBookResultSchema, {
      method: 'POST',
      body: input,
    });
  }
}
