import { z } from 'zod';
import { communitySchema } from '../communities/schema.js';
import { customTemplateSchema, templateSchema } from '../creation/schema.js';
import { discussionSchema } from '../discussions/schema.js';
import { bookReviewSchema, bookSchema } from '../library/schema.js';
import { newsArticleSchema } from '../news/schema.js';
import { codeProjectSchema, projectSchema } from '../projects/schema.js';
import { profileSchema } from '../profiles/schema.js';
import { publicationSchema } from '../research/schema.js';
import { techResourceSchema } from '../tech/schema.js';

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
    site_title: z.string().default('Studiorium'),
    hero_title: z.string().default('Conhecimento conecta.'),
    hero_text: z.string().default(''),
    site_notice: z.string().default(''),
    registrations_open: z.boolean().default(true),
    maintenance_mode: z.boolean().default(false),
  })
  .default({});

export const bootstrapSchema = z.object({
  templates: z.array(templateSchema).default([]),
  publications: z.array(publicationSchema).default([]),
  codeProjects: z.array(codeProjectSchema).default([]),
  news: z.array(newsArticleSchema).default([]),
  customTemplates: z.array(customTemplateSchema).default([]),
  books: z.array(bookSchema).default([]),
  bookReviews: z.array(bookReviewSchema).default([]),
  communityProjects: z.array(projectSchema).default([]),
  discussions: z.array(discussionSchema).default([]),
  profiles: z.array(profileSchema).default([]),
  techResources: z.array(techResourceSchema).default([]),
  communities: z.array(communitySchema).default([]),
  settings: siteSettingsSchema,
  user: publicUserSchema,
});

export type BootstrapPayload = z.infer<typeof bootstrapSchema>;

export function parseBootstrap(input: unknown): BootstrapPayload {
  return bootstrapSchema.parse(input);
}
