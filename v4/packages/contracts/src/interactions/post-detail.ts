import { z } from 'zod';
import { socialPostSchema } from '../posts/schema.js';
import { contentInteractionsSchema } from './schema.js';

export const postDetailSchema = z.object({
  post: socialPostSchema,
  interactions: contentInteractionsSchema,
});

export type PostDetail = z.infer<typeof postDetailSchema>;
