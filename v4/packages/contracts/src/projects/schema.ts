import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

export const projectVisibilitySchema = z.enum(['private', 'public']);

export const projectSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  title: z.string(),
  type: z.string().default('Projeto'),
  visibility: projectVisibilitySchema.default('private'),
  sections: z.array(z.record(z.string(), z.unknown())).default([]),
  notes: optionalText,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp,
});

export const createProjectInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  type: z.string().trim().min(2).max(60).default('Projeto'),
  visibility: projectVisibilitySchema.default('private'),
  notes: z.string().trim().max(4000).default(''),
});

export const codeProjectSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  title: z.string(),
  description: optionalText,
  visibility: projectVisibilitySchema.default('private'),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp,
});

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type CodeProject = z.infer<typeof codeProjectSchema>;
