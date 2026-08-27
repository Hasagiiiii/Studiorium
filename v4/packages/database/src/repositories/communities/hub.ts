import type { CommunityMember, Discussion } from '@lorion/contracts';
import { discussionSchema } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

type MemberRow = {
  user_id: string;
  role: string;
  joined_at: string | null;
};

type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
};

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

async function replyCounts(ids: string[]): Promise<Map<string, number>> {
  if (!ids.length) return new Map();
  const rows = queryList(
    await database()
      .from('replies')
      .select('discussion_id')
      .in('discussion_id', ids)
      .eq('status', 'published')
      .is('deleted_at', null),
  ) as ReplyRow[];
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.discussion_id, (counts.get(row.discussion_id) || 0) + 1);
  return counts;
}

export async function listCommunityMembers(communityId: string): Promise<CommunityMember[]> {
  const members = queryList(
    await database()
      .from('community_members')
      .select('user_id,role,joined_at')
      .eq('community_id', communityId)
      .eq('status', 'active')
      .neq('moderation_status', 'removed')
      .order('joined_at', { ascending: true }),
  ) as MemberRow[];

  if (!members.length) return [];

  const profiles = queryList(
    await database()
      .from('profiles')
      .select('user_id,username,display_name')
      .in(
        'user_id',
        members.map((member) => member.user_id),
      ),
  ) as ProfileRow[];
  const profilesByUser = new Map(profiles.map((profile) => [profile.user_id, profile]));

  return members.map((member) => {
    const profile = profilesByUser.get(member.user_id);
    return {
      userId: member.user_id,
      username: profile?.username || '',
      displayName: profile?.display_name || profile?.username || 'Membro',
      role: member.role,
      joinedAt: member.joined_at,
    };
  });
}

export async function listCommunityDiscussions(communityId: string): Promise<Discussion[]> {
  const links = queryList(
    await database()
      .from('community_content_links')
      .select('content_id')
      .eq('community_id', communityId)
      .eq('content_type', 'discussion')
      .eq('status', 'visible'),
  ) as Array<{ content_id: string }>;

  if (!links.length) return [];
  const ids = links.map((link) => link.content_id);
  const [result, counts] = await Promise.all([
    database()
      .from('discussions')
      .select('*')
      .in('id', ids)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    replyCounts(ids),
  ]);

  return queryList(result).map((row) => {
    const record = row as Record<string, unknown>;
    return mapDiscussion(record, counts.get(String(record.id)) || 0);
  });
}

export async function findDiscussionById(id: string): Promise<Discussion | null> {
  const [result, counts] = await Promise.all([
    database()
      .from('discussions')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .is('deleted_at', null)
      .maybeSingle(),
    replyCounts([id]),
  ]);
  if (result.error) throw new Error(result.error.message);
  return result.data
    ? mapDiscussion(result.data as Record<string, unknown>, counts.get(id) || 0)
    : null;
}

export async function createCommunityDiscussion(input: {
  communityId: string;
  discussionId: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  category: string;
}): Promise<boolean> {
  const result = await database().rpc('create_community_discussion', {
    p_community_id: input.communityId,
    p_discussion_id: input.discussionId,
    p_author_id: input.authorId,
    p_author_name: input.authorName,
    p_title: input.title,
    p_body: input.body,
    p_category: input.category,
  });
  if (result.error) throw new Error(result.error.message);
  return result.data === true;
}
