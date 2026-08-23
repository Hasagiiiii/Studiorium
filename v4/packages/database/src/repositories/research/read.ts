import { publicationSchema, type Publication } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

function mapPublication(row: Record<string, unknown>): Publication {
  return publicationSchema.parse({
    id: row.id,
    ownerId: row.owner_id,
    authorName: row.author_name,
    title: row.title,
    slug: row.slug,
    abstract: row.abstract,
    content: row.content,
    area: row.area,
    level: row.level,
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    license: row.license,
    status: row.status,
    views: Number(row.views || 0),
    downloads: Number(row.downloads || 0),
    boosts: Number(row.boosts || 0),
    featured: row.featured,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    coverName: row.cover_name,
    coverMime: row.cover_mime,
  });
}

function mapPublications(rows: unknown[]): Publication[] {
  return rows.map((row) => mapPublication(row as Record<string, unknown>));
}

export async function listPublishedResearch(): Promise<Publication[]> {
  const result = await database()
    .from('publications')
    .select('*')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('featured', { ascending: false })
    .order('boosts', { ascending: false })
    .order('created_at', { ascending: false });

  return mapPublications(queryList(result));
}

export async function listPublishedResearchByOwnerId(ownerId: string): Promise<Publication[]> {
  const result = await database()
    .from('publications')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return mapPublications(queryList(result));
}
