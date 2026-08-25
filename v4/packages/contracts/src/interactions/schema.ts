import { z } from 'zod';
import { timestamp } from '../common/fields.js';

export const commentModerationStatusSchema = z.enum([
  'clear',
  'hidden',
  'pending_review',
  'removed',
]);

export const commentBodySchema = z.string().trim().min(1).max(2000);
export const commentParentIdSchema = z.string().trim().min(1).max(180).nullable().default(null);

export const contentCommentSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  authorId: z.string(),
  authorUsername: z.string(),
  authorName: z.string(),
  parentId: z.string().nullable().default(null),
  body: z.string(),
  moderationStatus: commentModerationStatusSchema,
  createdAt: timestamp,
  updatedAt: timestamp,
  canEdit: z.boolean().default(false),
});

export const createCommentInputSchema = z.object({
  body: commentBodySchema,
  parentId: commentParentIdSchema,
});

export const updateCommentInputSchema = z.object({
  body: commentBodySchema,
});

export const contentInteractionSummarySchema = z.object({
  likeCount: z.number().int().nonnegative().default(0),
  commentCount: z.number().int().nonnegative().default(0),
  viewerLiked: z.boolean().default(false),
  canInteract: z.boolean().default(false),
});

export const contentInteractionsSchema = contentInteractionSummarySchema.extend({
  comments: z.array(contentCommentSchema).default([]),
});

export const likeMutationSchema = z.object({
  liked: z.boolean(),
  likeCount: z.number().int().nonnegative(),
});

export const commentMutationSchema = z.object({
  comment: contentCommentSchema,
  commentCount: z.number().int().nonnegative(),
});

export const commentDeleteSchema = z.object({
  deleted: z.literal(true),
  commentId: z.string(),
  commentCount: z.number().int().nonnegative(),
});

export type ContentComment = z.infer<typeof contentCommentSchema>;
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentInputSchema>;
export type ContentInteractionSummary = z.infer<typeof contentInteractionSummarySchema>;
export type ContentInteractions = z.infer<typeof contentInteractionsSchema>;
export type LikeMutation = z.infer<typeof likeMutationSchema>;
export type CommentMutation = z.infer<typeof commentMutationSchema>;
export type CommentDelete = z.infer<typeof commentDeleteSchema>;
