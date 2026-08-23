import { z } from 'zod';
import { timestamp } from '../common/fields.js';

export const socialContentVisibilitySchema = z.enum(['public', 'community']);
export const socialContentModerationSchema = z.enum([
  'clear',
  'hidden',
  'pending_review',
  'removed',
]);

export const postCommunitySchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
  })
  .nullable()
  .default(null);

export const socialPostSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorUsername: z.string(),
  authorName: z.string(),
  title: z.string().default(''),
  body: z.string(),
  community: postCommunitySchema,
  visibility: socialContentVisibilitySchema,
  moderationStatus: socialContentModerationSchema,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const createPostInputSchema = z.object({
  title: z.string().trim().max(160).default(''),
  body: z.string().trim().min(1).max(4000),
  communitySlug: z.string().trim().min(1).max(160).nullable().default(null),
});

export type SocialPost = z.infer<typeof socialPostSchema>;
export type CreatePostInput = z.infer<typeof createPostInputSchema>;
export type SocialContentVisibility = z.infer<typeof socialContentVisibilitySchema>;
