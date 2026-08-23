import { projectSchema, type CreateProjectInput, type Project } from '@lorion/contracts';
import { database } from '../../core/client.js';

export async function createProject(
  input: CreateProjectInput & { id: string; ownerId: string },
): Promise<Project> {
  const result = await database()
    .from('projects')
    .insert({
      id: input.id,
      user_id: input.ownerId,
      title: input.title,
      type: input.type,
      visibility: input.visibility,
      sections: [],
      notes: input.notes,
    })
    .select('*')
    .single();

  if (result.error) throw new Error(result.error.message);
  const row = result.data as Record<string, unknown>;
  return projectSchema.parse({
    id: row.id,
    ownerId: row.user_id,
    title: row.title,
    type: row.type,
    visibility: row.visibility,
    sections: Array.isArray(row.sections) ? row.sections : [],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  });
}
