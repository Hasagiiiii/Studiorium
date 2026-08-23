import { techResourceSchema, type TechResource } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

function mapTechResource(row: Record<string, unknown>): TechResource {
  return techResourceSchema.parse({
    id: row.id,
    ownerId: row.owner_id,
    authorName: row.author_name,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    hub: row.hub,
    category: row.category,
    tags: Array.isArray(row.tags) ? row.tags : [],
    status: row.status,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function listPublishedTechResources(): Promise<TechResource[]> {
  const result = await database()
    .from('tech_resources')
    .select('*')
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  return queryList(result).map((row) => mapTechResource(row as Record<string, unknown>));
}
