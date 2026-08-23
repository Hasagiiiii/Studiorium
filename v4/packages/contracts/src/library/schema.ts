import { z } from 'zod';
import { optionalText, safeHttpUrl, timestamp } from '../common/fields.js';

export const bookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  description: optionalText,
  category: z.string().default('Geral'),
  coverTheme: z.string().default('umber'),
  featured: z.boolean().default(false),
  submittedBy: z.string().nullable().default(null),
  isbn: optionalText,
  coverUrl: safeHttpUrl,
  purchaseUrl: safeHttpUrl,
  purchaseLabel: optionalText,
  ratingAverage: z.number().default(0),
  reviewCount: z.number().int().nonnegative().default(0),
  recommendationCount: z.number().int().nonnegative().default(0),
  createdAt: timestamp,
});

export const bookReviewSchema = z.object({
  bookId: z.string(),
  userId: z.string(),
  reviewerName: z.string(),
  rating: z.number().min(1).max(5),
  review: optionalText,
  recommend: z.boolean().default(true),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const bookShelfStatusSchema = z.enum(['want_to_read', 'reading', 'read', 'abandoned']);

export const bookSaveSchema = z.object({
  bookId: z.string(),
  shelfStatus: bookShelfStatusSchema,
  savedAt: timestamp,
});

export const bookDetailSchema = z.object({
  book: bookSchema,
  reviews: z.array(bookReviewSchema).default([]),
  viewerShelfStatus: bookShelfStatusSchema.nullable().default(null),
  viewerReview: bookReviewSchema.nullable().default(null),
});

export const saveBookInputSchema = z.object({ shelfStatus: bookShelfStatusSchema });

export const reviewBookInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().min(10).max(2400),
  recommend: z.boolean().default(true),
});

export const bookReviewMutationSchema = z.object({
  book: bookSchema,
  review: bookReviewSchema,
});

export const removeBookResultSchema = z.object({ removed: z.boolean(), bookId: z.string() });

export const createBookInputSchema = z.object({
  title: z.string().trim().min(2).max(180),
  author: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1400).default(''),
  category: z.string().trim().max(80).default('Leituras da comunidade'),
  isbn: z.string().trim().max(32).default(''),
  coverUrl: z.string().trim().max(1000).default(''),
  purchaseUrl: z.string().trim().max(1000).default(''),
  purchaseLabel: z.string().trim().max(80).default(''),
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().min(10).max(2400),
  recommend: z.boolean().default(true),
});

export const createBookResultSchema = bookReviewMutationSchema;

export type Book = z.infer<typeof bookSchema>;
export type BookReview = z.infer<typeof bookReviewSchema>;
export type BookShelfStatus = z.infer<typeof bookShelfStatusSchema>;
export type BookSave = z.infer<typeof bookSaveSchema>;
export type BookDetail = z.infer<typeof bookDetailSchema>;
export type SaveBookInput = z.infer<typeof saveBookInputSchema>;
export type ReviewBookInput = z.infer<typeof reviewBookInputSchema>;
export type BookReviewMutation = z.infer<typeof bookReviewMutationSchema>;
export type RemoveBookResult = z.infer<typeof removeBookResultSchema>;
export type CreateBookInput = z.infer<typeof createBookInputSchema>;
export type CreateBookResult = z.infer<typeof createBookResultSchema>;
