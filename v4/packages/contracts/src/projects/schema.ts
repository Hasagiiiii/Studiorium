import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

export const projectSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  title: z.string(),
  type: z.string().default('Projeto'),
  visibility: z.string().default('private'),
  sections: z.array(z.record(z.string(), z.unknown())).default([]),
  notes: optionalText,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp,
});

export const codeProjectSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  title: z.string(),
  description: optionalText,
  visibility: z.string().default('private'),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp,
});

export type Project = z.infer<typeof projectSchema>;
export type CodeProject = z.infer<typeof codeProjectSchema>;
