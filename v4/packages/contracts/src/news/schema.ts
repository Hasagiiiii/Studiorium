import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

export const newsSourceSchema = z.object({
  title: z.string().trim().min(2).max(180),
  url: z.string().url().max(1000),
});

export const newsArticleStatusSchema = z.enum([
  'draft',
  'ai_review',
  'editorial_review',
  'changes_requested',
  'published',
  'rejected',
  'archived',
]);

export const newsArticleSchema = z.object({
  id: z.string(),
  contributorId: z.string().nullable().default(null),
  authorName: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: optionalText,
  body: optionalText,
  category: z.string().default('Atualizações'),
  sources: z.array(newsSourceSchema).default([]),
  status: newsArticleStatusSchema,
  aiReviewStatus: z.enum(['pending', 'approved', 'flagged', 'unavailable']).default('pending'),
  aiReview: z.record(z.string(), z.unknown()).default({}),
  editorialNote: optionalText,
  featured: z.boolean().default(false),
  likeCount: z.number().int().nonnegative().default(0),
  certifiedBy: z.string().nullable().default(null),
  certifiedAt: timestamp,
  publishedAt: timestamp,
  deletedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const newsContributorSchema = z.object({
  userId: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  area: optionalText,
  institution: optionalText,
  portfolioUrl: optionalText,
  statement: optionalText,
  reviewerId: z.string().nullable().default(null),
  reviewNote: optionalText,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const applyNewsContributorInputSchema = z.object({
  area: z.string().trim().min(3).max(120),
  institution: z.string().trim().max(180).default(''),
  portfolioUrl: z.string().trim().max(1000).default(''),
  statement: z.string().trim().min(40).max(2000),
});

export const newsDraftInputSchema = z.object({
  title: z.string().trim().min(2).max(180),
  summary: z.string().trim().max(1000).default(''),
  body: z.string().trim().max(60000).default(''),
  category: z.string().trim().min(1).max(80).default('Atualizações'),
  sources: z.array(newsSourceSchema).max(12).default([]),
});

export const newsWorkspaceSchema = z.object({
  contributor: newsContributorSchema.nullable().default(null),
  canWrite: z.boolean().default(false),
  articles: z.array(newsArticleSchema).default([]),
  trash: z.array(newsArticleSchema).default([]),
});

export const newsDeleteResultSchema = z.object({ ok: z.boolean(), articleId: z.string() });

export const newsContributorDecisionInputSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().trim().max(1500).default(''),
});

export const newsEditorialDecisionInputSchema = z.object({
  status: z.enum(['published', 'changes_requested', 'rejected']),
  note: z.string().trim().max(1500).default(''),
  featured: z.boolean().default(false),
});

export type NewsSource = z.infer<typeof newsSourceSchema>;
export type NewsArticleStatus = z.infer<typeof newsArticleStatusSchema>;
export type NewsArticle = z.infer<typeof newsArticleSchema>;
export type NewsContributor = z.infer<typeof newsContributorSchema>;
export type ApplyNewsContributorInput = z.infer<typeof applyNewsContributorInputSchema>;
export type NewsDraftInput = z.infer<typeof newsDraftInputSchema>;
export type NewsWorkspace = z.infer<typeof newsWorkspaceSchema>;
export type NewsDeleteResult = z.infer<typeof newsDeleteResultSchema>;
export type NewsContributorDecisionInput = z.infer<typeof newsContributorDecisionInputSchema>;
export type NewsEditorialDecisionInput = z.infer<typeof newsEditorialDecisionInputSchema>;
