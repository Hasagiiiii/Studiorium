import { communitySchema, type Community } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

type MembershipRow = {
  community_id: string;
  user_id: string;
  role: string;
  status: string;
  moderation_status: string;
};

export async function listCommunities(viewerId?: string | null): Promise<Community[]> {
  const [communitiesResult, membershipsResult] = await Promise.all([
    database()
      .from('communities')
      .select('*')
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('is_official', { ascending: false })
      .order('name', { ascending: true }),
    database()
      .from('community_members')
      .select('community_id,user_id,role,status,moderation_status')
      .eq('status', 'active'),
  ]);

  const communities = queryList(communitiesResult);
  const memberships = queryList(membershipsResult) as MembershipRow[];
  const countByCommunity = new Map<string, number>();
  const viewerMembership = new Map<string, MembershipRow>();

  memberships.forEach((membership) => {
    countByCommunity.set(
      membership.community_id,
      (countByCommunity.get(membership.community_id) || 0) + 1,
    );
    if (viewerId && membership.user_id === viewerId) {
      viewerMembership.set(membership.community_id, membership);
    }
  });

  return communities
    .filter((raw) => {
      const row = raw as Record<string, unknown>;
      const id = String(row.id);
      const visibility = String(row.visibility || 'public');
      return visibility !== 'private' || viewerMembership.has(id);
    })
    .map((raw) => {
      const row = raw as Record<string, unknown>;
      const id = String(row.id);
      const membership = viewerMembership.get(id);
      return communitySchema.parse({
        id: row.id,
        slug: row.slug,
        name: row.name,
        area: row.area,
        description: row.description,
        visibility: row.visibility,
        status: row.status,
        official: row.is_official,
        rules: Array.isArray(row.rules) ? row.rules : [],
        memberCount: countByCommunity.get(id) || 0,
        joined: Boolean(membership),
        role: membership?.role || null,
        memberModerationStatus: membership?.moderation_status || null,
      });
    });
}
