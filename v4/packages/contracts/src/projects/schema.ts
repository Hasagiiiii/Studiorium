import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

export const projectVisibilitySchema = z.enum(['private', 'public']);

export const projectSectionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  content: z.string().max(30000).default(''),
});

export const projectSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  title: z.string(),
  type: z.string().default('Projeto'),
  visibility: projectVisibilitySchema.default('private'),
  sections: z.array(projectSectionSchema).default([]),
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

export const updateProjectInputSchema = z.object({
  title: z.string().trim().min(2).max(160),
  sections: z.array(projectSectionSchema).max(20),
  notes: z.string().max(10000).default(''),
  visibility: projectVisibilitySchema,
});

export const projectDetailSchema = z.object({
  project: projectSchema,
  isOwner: z.boolean(),
});

export const projectDeleteResultSchema = z.object({ ok: z.boolean(), projectId: z.string() });
export const projectTrashSchema = z.object({ projects: z.array(projectSchema).default([]) });

export type ProjectVisibility = z.infer<typeof projectVisibilitySchema>;
export type ProjectSection = z.infer<typeof projectSectionSchema>;
export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;
export type ProjectDetail = z.infer<typeof projectDetailSchema>;
export type ProjectDeleteResult = z.infer<typeof projectDeleteResultSchema>;
export type ProjectTrash = z.infer<typeof projectTrashSchema>;
