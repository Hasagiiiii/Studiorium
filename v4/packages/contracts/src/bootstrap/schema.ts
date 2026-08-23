import { z } from 'zod';
import { communitySchema } from '../communities/schema.js';
import { discussionSchema } from '../discussions/schema.js';
import { bookReviewSchema, bookSchema } from '../library/schema.js';
import { newsArticleSchema } from '../news/schema.js';
import { codeProjectSchema, projectSchema } from '../projects/schema.js';
import { profileSchema } from '../profiles/schema.js';
import { publicationSchema } from '../research/schema.js';

export const publicUserSchema = z
  .object({
    id: z.string(),
    username: z.string().optional(),
    displayName: z.string(),
    email: z.string().email().optional(),
    role: z.string().default('user'),
    status: z.string().default('active'),
  })
  .nullable()
  .default(null);

export const siteSettingsSchema = z
  .object({
    site_title: z.string().default('Lorion'),
    hero_title: z.string().default('Conhecimento conecta.'),
    hero_text: z.string().default(''),
    site_notice: z.string().default(''),
    registrations_open: z.boolean().default(true),
    maintenance_mode: z.boolean().default(false),
  })
  .default({});

export const bootstrapSchema = z.object({
  publications: z.array(publicationSchema).default([]),
  codeProjects: z.array(codeProjectSchema).default([]),
  news: z.array(newsArticleSchema).default([]),
  books: z.array(bookSchema).default([]),
  bookReviews: z.array(bookReviewSchema).default([]),
  projects: z.array(projectSchema).default([]),
  discussions: z.array(discussionSchema).default([]),
  profiles: z.array(profileSchema).default([]),
  communities: z.array(communitySchema).default([]),
  settings: siteSettingsSchema,
  user: publicUserSchema,
});

export type PublicUser = z.infer<typeof publicUserSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type BootstrapPayload = z.infer<typeof bootstrapSchema>;

export function parseBootstrap(input: unknown): BootstrapPayload {
  return bootstrapSchema.parse(input);
}
