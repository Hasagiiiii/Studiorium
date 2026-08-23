import {
  customTemplateSchema,
  templateSchema,
  type CustomTemplate,
  type Template,
} from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

function mapTemplate(row: Record<string, unknown>): Template {
  return templateSchema.parse({
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    docType: row.doc_type,
    style: row.style,
    description: row.description,
    downloads: Number(row.downloads || 0),
    featured: row.featured,
    sections: Array.isArray(row.sections) ? row.sections : [],
  });
}

function mapCustomTemplate(row: Record<string, unknown>): CustomTemplate {
  return customTemplateSchema.parse({
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    sourceType: row.source_type,
    status: row.status,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  });
}

export async function listTemplates(): Promise<Template[]> {
  const result = await database()
    .from('templates')
    .select('*')
    .order('featured', { ascending: false })
    .order('downloads', { ascending: false });

  return queryList(result).map((row) => mapTemplate(row as Record<string, unknown>));
}

export async function listPublishedCustomTemplates(): Promise<CustomTemplate[]> {
  const result = await database()
    .from('custom_templates')
    .select('id,owner_id,title,description,source_type,status,featured,deleted_at,created_at,updated_at')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('featured', { ascending: false })
    .order('updated_at', { ascending: false });

  return queryList(result).map((row) => mapCustomTemplate(row as Record<string, unknown>));
}
