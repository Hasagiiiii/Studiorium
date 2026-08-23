import { z } from 'zod';

export const postKindSchema = z.enum(['text', 'photo', 'photo_text', 'video']);
export const mediaKindSchema = z.enum(['image', 'video']);

export const postMediaSchema = z.object({
  id: z.string().min(1),
  kind: mediaKindSchema,
  url: z.string().url(),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
  durationSeconds: z.number().positive().max(60).nullable().default(null),
});

export const socialPostSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  authorUsername: z.string().min(1),
  authorDisplayName: z.string().min(1),
  kind: postKindSchema,
  body: z.string().max(5000).nullable().default(null),
  media: postMediaSchema.nullable().default(null),
  createdAt: z.string().min(1),
  likeCount: z.number().int().nonnegative().default(0),
});

export const mediaReservationInputSchema = z.object({
  kind: mediaKindSchema,
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive(),
  durationSeconds: z.number().positive().max(60).nullable().optional(),
});

export const mediaReservationSchema = z.object({
  mediaId: z.string().min(1),
  path: z.string().min(1),
  signedUrl: z.string().url(),
  token: z.string().min(1),
  publicUrl: z.string().url(),
});

export const mediaFinalizeInputSchema = z.object({
  mediaId: z.string().min(1),
  durationSeconds: z.number().positive().max(60).nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
});

export const createPostInputSchema = z.object({
  kind: postKindSchema,
  body: z.string().trim().max(5000).nullable().optional(),
  mediaId: z.string().min(1).nullable().optional(),
});

export const socialPostsResponseSchema = z.object({
  posts: z.array(socialPostSchema).default([]),
});

export type PostKind = z.infer<typeof postKindSchema>;
export type MediaKind = z.infer<typeof mediaKindSchema>;
export type PostMedia = z.infer<typeof postMediaSchema>;
export type SocialPost = z.infer<typeof socialPostSchema>;
export type MediaReservationInput = z.infer<typeof mediaReservationInputSchema>;
export type MediaReservation = z.infer<typeof mediaReservationSchema>;
export type MediaFinalizeInput = z.infer<typeof mediaFinalizeInputSchema>;
export type CreatePostInput = z.infer<typeof createPostInputSchema>;
export type SocialPostsResponse = z.infer<typeof socialPostsResponseSchema>;
