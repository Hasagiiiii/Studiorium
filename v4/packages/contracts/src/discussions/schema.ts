import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

export const discussionContentStatusSchema = z.enum([
  'published',
  'hidden',
  'pending_review',
]);

export const discussionSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  title: z.string(),
  body: optionalText,
  category: z.string().default('Geral'),
  status: discussionContentStatusSchema,
  replyCount: z.number().int().nonnegative().default(0),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const replySchema = z.object({
  id: z.string(),
  discussionId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  body: z.string(),
  status: discussionContentStatusSchema,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export type DiscussionContentStatus = z.infer<typeof discussionContentStatusSchema>;
export type Discussion = z.infer<typeof discussionSchema>;
export type Reply = z.infer<typeof replySchema>;
