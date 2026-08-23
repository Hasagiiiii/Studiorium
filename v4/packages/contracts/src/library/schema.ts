import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

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
  coverUrl: optionalText,
  purchaseUrl: optionalText,
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

export type Book = z.infer<typeof bookSchema>;
export type BookReview = z.infer<typeof bookReviewSchema>;
