import { discussionSchema, type Discussion } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

function mapDiscussion(row: Record<string, unknown>): Discussion {
  return discussionSchema.parse({
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    title: row.title,
    body: row.body,
    category: row.category,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function listPublishedDiscussions(): Promise<Discussion[]> {
  const result = await database()
    .from('discussions')
    .select('*')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return queryList(result).map((row) => mapDiscussion(row as Record<string, unknown>));
}
