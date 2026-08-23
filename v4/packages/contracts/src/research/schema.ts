import { z } from 'zod';
import { nullableText, optionalText, timestamp } from '../common/fields.js';

export const publicationStatusSchema = z.enum(['draft', 'pending_review', 'published', 'rejected']);

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
  status: publicationStatusSchema,
  moderationNote: optionalText,
  views: z.number().int().nonnegative().default(0),
  downloads: z.number().int().nonnegative().default(0),
  boosts: z.number().int().nonnegative().default(0),
  featured: z.boolean().default(false),
  createdAt: timestamp,
  publishedAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp,
  coverName: nullableText.default(null),
  coverMime: nullableText.default(null),
  fileName: nullableText.default(null),
  fileMime: nullableText.default(null),
});

export const researchDraftInputSchema = z.object({
  title: z.string().trim().min(2).max(180),
  abstract: z.string().trim().max(5000).default(''),
  content: z.string().trim().max(60000).default(''),
  area: z.string().trim().min(1).max(80).default('Geral'),
  level: z.string().trim().min(1).max(80).default('Não informado'),
  keywords: z.array(z.string().trim().min(1).max(60)).max(10).default([]),
  license: z.string().trim().max(80).default('Todos os direitos reservados'),
});

export const researchWorkspaceSchema = z.object({
  publications: z.array(publicationSchema).default([]),
  trash: z.array(publicationSchema).default([]),
});

export const publicationDeleteResultSchema = z.object({ ok: z.boolean(), publicationId: z.string() });

export const publicationReviewInputSchema = z.object({
  status: z.enum(['published', 'rejected', 'pending_review']),
  note: z.string().trim().max(1500).default(''),
  featured: z.boolean().default(false),
});

export type PublicationStatus = z.infer<typeof publicationStatusSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type ResearchDraftInput = z.infer<typeof researchDraftInputSchema>;
export type ResearchWorkspace = z.infer<typeof researchWorkspaceSchema>;
export type PublicationDeleteResult = z.infer<typeof publicationDeleteResultSchema>;
export type PublicationReviewInput = z.infer<typeof publicationReviewInputSchema>;
