import {
  codeProjectSchema,
  projectSchema,
  type CodeProject,
  type Project,
} from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

function mapProject(row: Record<string, unknown>): Project {
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

function mapCodeProject(row: Record<string, unknown>): CodeProject {
  return codeProjectSchema.parse({
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  });
}

export async function listPublicProjects(): Promise<Project[]> {
  const result = await database()
    .from('projects')
    .select('*')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(200);

  return queryList(result).map((row) => mapProject(row as Record<string, unknown>));
}

export async function listUserProjects(userId: string): Promise<Project[]> {
  const result = await database()
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  return queryList(result).map((row) => mapProject(row as Record<string, unknown>));
}

export async function listPublicCodeProjects(): Promise<CodeProject[]> {
  const result = await database()
    .from('code_projects')
    .select('id,owner_id,title,description,visibility,created_at,updated_at,deleted_at')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  return queryList(result).map((row) => mapCodeProject(row as Record<string, unknown>));
}

export async function listUserCodeProjects(userId: string): Promise<CodeProject[]> {
  const result = await database()
    .from('code_projects')
    .select('id,owner_id,title,description,visibility,created_at,updated_at,deleted_at')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  return queryList(result).map((row) => mapCodeProject(row as Record<string, unknown>));
}
