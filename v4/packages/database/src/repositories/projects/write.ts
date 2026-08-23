import {
  type CreateProjectInput,
  type Project,
  type UpdateProjectInput,
} from '@lorion/contracts';
import { database } from '../../core/client.js';
import { mapProject } from './read.js';

const DEFAULT_SECTIONS = [
  { name: 'Introdução', content: '' },
  { name: 'Desenvolvimento', content: '' },
  { name: 'Conclusão', content: '' },
  { name: 'Referências', content: '' },
];

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
      sections: DEFAULT_SECTIONS,
      notes: input.notes,
      template_id: null,
    })
    .select('*')
    .single();

  if (result.error) throw new Error(result.error.message);
  return mapProject(result.data as Record<string, unknown>);
}

export async function updateOwnedProject(
  projectId: string,
  ownerId: string,
  input: UpdateProjectInput,
): Promise<Project | null> {
  const result = await database()
    .from('projects')
    .update({
      title: input.title,
      sections: input.sections,
      notes: input.notes,
      visibility: input.visibility,
      updated_at: new Date().toISOString(),
      template_id: null,
    })
    .eq('id', projectId)
    .eq('user_id', ownerId)
    .is('deleted_at', null)
    .select('*')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapProject(result.data as Record<string, unknown>) : null;
}

export async function softDeleteOwnedProject(projectId: string, ownerId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await database()
    .from('projects')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', projectId)
    .eq('user_id', ownerId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function restoreOwnedProject(projectId: string, ownerId: string): Promise<boolean> {
  const result = await database()
    .from('projects')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', ownerId)
    .not('deleted_at', 'is', null)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function purgeOwnedProject(projectId: string, ownerId: string): Promise<boolean> {
  const result = await database()
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', ownerId)
    .not('deleted_at', 'is', null)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}
