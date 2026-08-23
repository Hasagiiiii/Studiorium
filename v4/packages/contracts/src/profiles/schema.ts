import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';
import { bookSchema } from '../library/schema.js';
import { socialPostSchema } from '../posts/schema.js';
import { projectSchema } from '../projects/schema.js';
import { publicationSchema } from '../research/schema.js';

export const profileSchema = z.object({
  userId: z.string(),
  username: z.string(),
  displayName: z.string(),
  bio: optionalText,
  profileType: z.string().default('membro'),
  institution: optionalText,
  course: optionalText,
  educationLevel: optionalText,
  verificationStatus: z.string().default('unverified'),
  verifiedSpecialty: optionalText,
  contributionStatus: z.string().default('member'),
  hasAvatar: z.boolean().default(false),
  hasCover: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  bookshelfPublic: z.boolean().default(false),
  verifiedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const bookshelfStatusSchema = z.enum(['want_to_read', 'reading', 'read', 'abandoned']);

export const profileBookshelfItemSchema = z.object({
  book: bookSchema,
  shelfStatus: bookshelfStatusSchema,
  savedAt: timestamp,
});

export const profileCommunitySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  area: z.string(),
  role: z.string(),
  official: z.boolean().default(false),
});

export const profileDetailSchema = z.object({
  profile: profileSchema,
  posts: z.array(socialPostSchema).default([]),
  publications: z.array(publicationSchema).default([]),
  projects: z.array(projectSchema).default([]),
  communities: z.array(profileCommunitySchema).default([]),
  bookshelf: z.array(profileBookshelfItemSchema).default([]),
  isOwnProfile: z.boolean().default(false),
});

export const bookshelfPrivacyInputSchema = z.object({
  bookshelfPublic: z.boolean(),
});

export type Profile = z.infer<typeof profileSchema>;
export type BookshelfStatus = z.infer<typeof bookshelfStatusSchema>;
export type ProfileBookshelfItem = z.infer<typeof profileBookshelfItemSchema>;
export type ProfileCommunity = z.infer<typeof profileCommunitySchema>;
export type ProfileDetail = z.infer<typeof profileDetailSchema>;
export type BookshelfPrivacyInput = z.infer<typeof bookshelfPrivacyInputSchema>;
