import { discussionSchema, type Discussion } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

type ReplyRow = { discussion_id: string };

function mapDiscussion(row: Record<string, unknown>, replyCount = 0): Discussion {
  return discussionSchema.parse({
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    title: row.title,
    body: row.body,
    category: row.category,
    status: row.status,
    replyCount,
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

  const rows = queryList(result) as Array<Record<string, unknown>>;
  if (!rows.length) return [];
  const ids = rows.map((row) => String(row.id));
  const replies = queryList(
    await database()
      .from('replies')
      .select('discussion_id')
      .in('discussion_id', ids)
      .eq('status', 'published')
      .is('deleted_at', null),
  ) as ReplyRow[];
  const counts = new Map<string, number>();
  for (const reply of replies) counts.set(reply.discussion_id, (counts.get(reply.discussion_id) || 0) + 1);

  return rows.map((row) => mapDiscussion(row, counts.get(String(row.id)) || 0));
}
