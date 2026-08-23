import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

export const techResourceSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  authorName: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: optionalText,
  hub: z.string().default('Tecnologia'),
  category: z.string().default('Tutorial'),
  tags: z.array(z.string()).default([]),
  status: z.string(),
  featured: z.boolean().default(false),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export type TechResource = z.infer<typeof techResourceSchema>;
