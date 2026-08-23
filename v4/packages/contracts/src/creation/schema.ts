import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

export const templateSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.string(),
  docType: z.string(),
  style: z.string().default('Clássico'),
  description: optionalText,
  downloads: z.number().int().nonnegative().default(0),
  featured: z.boolean().default(false),
  sections: z.array(z.string()).default([]),
});

export const customTemplateSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  title: z.string(),
  description: optionalText,
  sourceType: z.string().default('editor'),
  status: z.string(),
  featured: z.boolean().default(false),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp,
});

export type Template = z.infer<typeof templateSchema>;
export type CustomTemplate = z.infer<typeof customTemplateSchema>;
