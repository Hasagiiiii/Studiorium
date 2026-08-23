import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

export const newsArticleSchema = z.object({
  id: z.string(),
  contributorId: z.string().nullable().default(null),
  authorName: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: optionalText,
  body: optionalText,
  category: z.string().default('Atualizações'),
  status: z.string(),
  featured: z.boolean().default(false),
  likeCount: z.number().int().nonnegative().default(0),
  certifiedBy: z.string().nullable().default(null),
  certifiedAt: timestamp,
  publishedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export type NewsArticle = z.infer<typeof newsArticleSchema>;
