import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

export const discussionSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  title: z.string(),
  body: optionalText,
  category: z.string().default('Geral'),
  status: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const replySchema = z.object({
  id: z.string(),
  discussionId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  body: z.string(),
  status: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export type Discussion = z.infer<typeof discussionSchema>;
export type Reply = z.infer<typeof replySchema>;
