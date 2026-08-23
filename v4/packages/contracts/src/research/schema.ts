import { z } from 'zod';
import { nullableText, optionalText, timestamp } from '../common/fields.js';

export const publicationSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  authorName: z.string(),
  title: z.string(),
  slug: z.string(),
  abstract: optionalText,
  content: optionalText,
  area: z.string().default('Geral'),
  level: z.string().default('Não informado'),
  keywords: z.array(z.string()).default([]),
  license: optionalText,
  status: z.string(),
  views: z.number().int().nonnegative().default(0),
  downloads: z.number().int().nonnegative().default(0),
  boosts: z.number().int().nonnegative().default(0),
  featured: z.boolean().default(false),
  createdAt: timestamp,
  publishedAt: timestamp,
  updatedAt: timestamp,
  coverName: nullableText.default(null),
  coverMime: nullableText.default(null),
});

export type Publication = z.infer<typeof publicationSchema>;
