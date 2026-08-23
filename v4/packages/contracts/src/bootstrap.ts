import { z } from 'zod';
import {
  bookReviewSchema,
  bookSchema,
  codeProjectSchema,
  communitySchema,
  customTemplateSchema,
  discussionSchema,
  newsArticleSchema,
  profileSchema,
  projectSchema,
  publicationSchema,
  techResourceSchema,
  templateSchema,
} from './resources.js';

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
