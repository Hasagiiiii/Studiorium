import { projectSchema, type Project } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

export function mapProject(row: Record<string, unknown>): Project {
  const sections = Array.isArray(row.sections) ? row.sections : [];
  return projectSchema.parse({
    id: row.id,
    ownerId: row.user_id,
    title: row.title,
    type: row.type,
    visibility: row.visibility,
    sections,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  });
}

function mapProjects(rows: unknown[]): Project[] {
  return rows.map((row) => mapProject(row as Record<string, unknown>));
}

export async function listPublicProjects(): Promise<Project[]> {
  const result = await database()
    .from('projects')
    .select('*')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(200);

  return mapProjects(queryList(result));
}

export async function listPublicProjectsByUserId(userId: string): Promise<Project[]> {
  const result = await database()
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  return mapProjects(queryList(result));
}

export async function listUserProjects(userId: string): Promise<Project[]> {
  const result = await database()
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  return mapProjects(queryList(result));
}

export async function listDeletedUserProjects(userId: string): Promise<Project[]> {
  const result = await database()
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
    .limit(100);
  return mapProjects(queryList(result));
}

export async function findProjectForViewer(
  projectId: string,
  viewerId?: string | null,
): Promise<Project | null> {
  const result = await database()
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) return null;
  const project = mapProject(result.data as Record<string, unknown>);
  if (project.visibility !== 'public' && project.ownerId !== viewerId) return null;
  return project;
}
