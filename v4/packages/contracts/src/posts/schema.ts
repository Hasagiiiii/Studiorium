import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

export const MAX_POST_MEDIA = 10;
export const MAX_POST_VIDEO_DURATION_SECONDS = 60;

export const socialContentVisibilitySchema = z.enum(['public', 'community']);
export const socialContentModerationSchema = z.enum([
  'clear',
  'hidden',
  'pending_review',
  'removed',
]);

export const postMediaTypeSchema = z.enum(['image', 'video']);

export const postMediaSchema = z
  .object({
    id: z.string(),
    type: postMediaTypeSchema,
    url: z.string().min(1),
    previewUrl: z.string().min(1).nullable().default(null),
    caption: optionalText,
    width: z.number().int().positive().nullable().default(null),
    height: z.number().int().positive().nullable().default(null),
    durationSeconds: z.number().nonnegative().nullable().default(null),
    position: z.number().int().nonnegative().default(0),
  })
  .superRefine((media, context) => {
    if (media.type === 'video') {
      if (media.durationSeconds === null) {
        context.addIssue({
          code: 'custom',
          path: ['durationSeconds'],
          message: 'Vídeos precisam informar a duração.',
        });
      } else if (media.durationSeconds > MAX_POST_VIDEO_DURATION_SECONDS) {
        context.addIssue({
          code: 'custom',
          path: ['durationSeconds'],
          message: `Vídeos podem ter no máximo ${MAX_POST_VIDEO_DURATION_SECONDS} segundos.`,
        });
      }
    }
  });

export const postMediaCollectionSchema = z.array(postMediaSchema).max(MAX_POST_MEDIA).default([]);

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
  media: postMediaCollectionSchema,
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

export type PostMediaType = z.infer<typeof postMediaTypeSchema>;
export type PostMedia = z.infer<typeof postMediaSchema>;
export type SocialPost = z.infer<typeof socialPostSchema>;
export type CreatePostInput = z.infer<typeof createPostInputSchema>;
export type SocialContentVisibility = z.infer<typeof socialContentVisibilitySchema>;
