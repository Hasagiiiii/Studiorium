import {
  communitySchema,
  profileCommunitySchema,
  type Community,
  type ProfileCommunity,
} from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

type MembershipRow = {
  community_id: string;
  user_id: string;
  role: string;
  status: string;
  moderation_status: string;
};

function isParticipating(membership: MembershipRow | undefined): boolean {
  return Boolean(
    membership && membership.status === 'active' && membership.moderation_status !== 'removed',
  );
}

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
  const activeMemberships = queryList(membershipsResult) as MembershipRow[];
  const viewerMemberships = viewerId
    ? (queryList(
        await database()
          .from('community_members')
          .select('community_id,user_id,role,status,moderation_status')
          .eq('user_id', viewerId),
      ) as MembershipRow[])
    : [];
  const countByCommunity = new Map<string, number>();
  const viewerMembership = new Map<string, MembershipRow>();

  activeMemberships.forEach((membership) => {
    if (membership.moderation_status !== 'removed') {
      countByCommunity.set(
        membership.community_id,
        (countByCommunity.get(membership.community_id) || 0) + 1,
      );
    }
  });

  viewerMemberships.forEach((membership) => {
    viewerMembership.set(membership.community_id, membership);
  });

  return communities
    .filter((raw) => {
      const row = raw as Record<string, unknown>;
      const id = String(row.id);
      const visibility = String(row.visibility || 'public');
      return visibility !== 'private' || isParticipating(viewerMembership.get(id));
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
        joined: isParticipating(membership),
        membershipStatus: membership?.status || null,
        role: membership?.role || null,
        memberModerationStatus: membership?.moderation_status || null,
      });
    });
}

export async function listProfileCommunities(
  userId: string,
  includeControlled = false,
): Promise<ProfileCommunity[]> {
  const memberships = queryList(
    await database()
      .from('community_members')
      .select('community_id,user_id,role,status,moderation_status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('moderation_status', 'removed'),
  ) as MembershipRow[];

  if (!memberships.length) return [];

  let query = database()
    .from('communities')
    .select('id,slug,name,area,visibility,is_official,status,deleted_at')
    .in(
      'id',
      memberships.map((membership) => membership.community_id),
    )
    .eq('status', 'active')
    .is('deleted_at', null);

  if (!includeControlled) query = query.eq('visibility', 'public');

  const communities = queryList(await query);
  const membershipByCommunity = new Map(
    memberships.map((membership) => [membership.community_id, membership]),
  );

  return communities
    .map((raw) => {
      const row = raw as Record<string, unknown>;
      const membership = membershipByCommunity.get(String(row.id));
      if (!membership) return null;
      return profileCommunitySchema.parse({
        id: row.id,
        slug: row.slug,
        name: row.name,
        area: row.area,
        role: membership.role,
        official: row.is_official,
      });
    })
    .filter((community): community is ProfileCommunity => Boolean(community))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
