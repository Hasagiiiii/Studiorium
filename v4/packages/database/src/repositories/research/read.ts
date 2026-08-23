import { publicationSchema, type Publication } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

export function mapPublication(row: Record<string, unknown>): Publication {
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
    moderationNote: row.moderation_note,
    views: Number(row.views || 0),
    downloads: Number(row.downloads || 0),
    boosts: Number(row.boosts || 0),
    featured: row.featured,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    coverName: row.cover_name,
    coverMime: row.cover_mime,
    fileName: row.file_name,
    fileMime: row.file_mime,
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

export async function listOwnedResearch(ownerId: string, deleted = false): Promise<Publication[]> {
  let query = database()
    .from('publications')
    .select('*')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });
  query = deleted ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null);
  return mapPublications(queryList(await query));
}

export async function findOwnedResearch(id: string, ownerId: string): Promise<Publication | null> {
  const result = await database()
    .from('publications')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapPublication(result.data as Record<string, unknown>) : null;
}

export async function listPendingResearchReview(): Promise<Publication[]> {
  const result = await database()
    .from('publications')
    .select('*')
    .eq('status', 'pending_review')
    .is('deleted_at', null)
    .order('updated_at', { ascending: true });
  return mapPublications(queryList(result));
}
