import { z } from 'zod';
import { communitySchema } from '../communities/schema.js';
import { discussionSchema } from '../discussions/schema.js';
import { bookReviewSchema, bookSchema } from '../library/schema.js';
import { newsArticleSchema } from '../news/schema.js';
import { projectSchema } from '../projects/schema.js';
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

const DEFAULT_SITE_SETTINGS = {
  site_title: 'Lorion',
  hero_title: 'Conhecimento conecta.',
  hero_text: '',
  site_notice: '',
  registrations_open: true,
  maintenance_mode: false,
};

const DEFAULT_CAPABILITIES = {
  passwordResetAvailable: false,
};

export const siteSettingsSchema = z
  .object({
    site_title: z.string().default(DEFAULT_SITE_SETTINGS.site_title),
    hero_title: z.string().default(DEFAULT_SITE_SETTINGS.hero_title),
    hero_text: z.string().default(DEFAULT_SITE_SETTINGS.hero_text),
    site_notice: z.string().default(DEFAULT_SITE_SETTINGS.site_notice),
    registrations_open: z.boolean().default(DEFAULT_SITE_SETTINGS.registrations_open),
    maintenance_mode: z.boolean().default(DEFAULT_SITE_SETTINGS.maintenance_mode),
  })
  .default(DEFAULT_SITE_SETTINGS);

export const capabilitiesSchema = z
  .object({
    passwordResetAvailable: z.boolean().default(DEFAULT_CAPABILITIES.passwordResetAvailable),
  })
  .default(DEFAULT_CAPABILITIES);

export const bootstrapSchema = z.object({
  publications: z.array(publicationSchema).default([]),
  news: z.array(newsArticleSchema).default([]),
  books: z.array(bookSchema).default([]),
  bookReviews: z.array(bookReviewSchema).default([]),
  projects: z.array(projectSchema).default([]),
  discussions: z.array(discussionSchema).default([]),
  profiles: z.array(profileSchema).default([]),
  communities: z.array(communitySchema).default([]),
  settings: siteSettingsSchema,
  capabilities: capabilitiesSchema,
  user: publicUserSchema,
});

export type PublicUser = z.infer<typeof publicUserSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type Capabilities = z.infer<typeof capabilitiesSchema>;
export type BootstrapPayload = z.infer<typeof bootstrapSchema>;

export function parseBootstrap(input: unknown): BootstrapPayload {
  return bootstrapSchema.parse(input);
}
