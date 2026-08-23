import type {
  CommunityMembershipRequest,
  CommunityMembershipResult,
} from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

type CommunityTargetRow = {
  id: string;
  slug: string;
  visibility: string;
  status: string;
  deleted_at: string | null;
};

type MembershipRow = {
  community_id: string;
  user_id: string;
  role: string;
  status: string;
  moderation_status: string;
  joined_at?: string | null;
};

type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
};

export async function findCommunityMembershipTarget(
  slug: string,
): Promise<CommunityTargetRow | null> {
  const result = await database()
    .from('communities')
    .select('id,slug,visibility,status,deleted_at')
    .eq('slug', slug)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data as CommunityTargetRow | null;
}

export async function findCommunityMembership(
  communityId: string,
  userId: string,
): Promise<MembershipRow | null> {
  const result = await database()
    .from('community_members')
    .select('community_id,user_id,role,status,moderation_status,joined_at')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data as MembershipRow | null;
}

async function activeMemberCount(communityId: string): Promise<number> {
  const result = await database()
    .from('community_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('community_id', communityId)
    .eq('status', 'active')
    .neq('moderation_status', 'removed');
  if (result.error) throw new Error(result.error.message);
  return result.count || 0;
}

async function membershipResult(
  communityId: string,
  userId: string,
): Promise<CommunityMembershipResult> {
  const membership = await findCommunityMembership(communityId, userId);
  return {
    communityId,
    joined: membership?.status === 'active' && membership.moderation_status !== 'removed',
    membershipStatus:
      membership?.status === 'active' ||
      membership?.status === 'left' ||
      membership?.status === 'pending' ||
      membership?.status === 'rejected'
        ? membership.status
        : null,
    role: membership?.role || null,
    memberModerationStatus: membership?.moderation_status || null,
    memberCount: await activeMemberCount(communityId),
  };
}

export async function joinPublicCommunity(
  communityId: string,
  userId: string,
  current: MembershipRow | null,
): Promise<CommunityMembershipResult> {
  if (!current) {
    const insert = await database().from('community_members').insert({
      community_id: communityId,
      user_id: userId,
      role: 'member',
      status: 'active',
      moderation_status: 'clear',
    });
    if (insert.error) throw new Error(insert.error.message);
  } else if (current.status !== 'active') {
    const update = await database()
      .from('community_members')
      .update({
        role: 'member',
        status: 'active',
        updated_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      })
      .eq('community_id', communityId)
      .eq('user_id', userId);
    if (update.error) throw new Error(update.error.message);
  }

  return membershipResult(communityId, userId);
}

export async function requestRestrictedCommunity(
  communityId: string,
  userId: string,
  current: MembershipRow | null,
): Promise<CommunityMembershipResult> {
  const now = new Date().toISOString();
  if (!current) {
    const insert = await database().from('community_members').insert({
      community_id: communityId,
      user_id: userId,
      role: 'member',
      status: 'pending',
      moderation_status: 'clear',
      joined_at: now,
      updated_at: now,
    });
    if (insert.error) throw new Error(insert.error.message);
  } else if (current.status !== 'pending' && current.status !== 'active') {
    const update = await database()
      .from('community_members')
      .update({
        role: 'member',
        status: 'pending',
        joined_at: now,
        updated_at: now,
      })
      .eq('community_id', communityId)
      .eq('user_id', userId);
    if (update.error) throw new Error(update.error.message);
  }

  return membershipResult(communityId, userId);
}

export async function leaveCommunity(
  communityId: string,
  userId: string,
  current: MembershipRow,
): Promise<CommunityMembershipResult> {
  if (current.status === 'active') {
    const update = await database()
      .from('community_members')
      .update({
        status: 'left',
        updated_at: new Date().toISOString(),
      })
      .eq('community_id', communityId)
      .eq('user_id', userId);
    if (update.error) throw new Error(update.error.message);
  }

  return membershipResult(communityId, userId);
}

export async function listPendingCommunityMembershipRequests(
  communityId: string,
): Promise<CommunityMembershipRequest[]> {
  const pending = queryList(
    await database()
      .from('community_members')
      .select('user_id,joined_at')
      .eq('community_id', communityId)
      .eq('status', 'pending')
      .eq('moderation_status', 'clear')
      .order('joined_at', { ascending: true }),
  ) as Array<{ user_id: string; joined_at: string | null }>;

  if (!pending.length) return [];

  const userIds = pending.map((item) => item.user_id);
  const profiles = queryList(
    await database()
      .from('profiles')
      .select('user_id,username,display_name')
      .in('user_id', userIds),
  ) as ProfileRow[];
  const profilesByUser = new Map(profiles.map((profile) => [profile.user_id, profile]));

  return pending.map((item) => {
    const profile = profilesByUser.get(item.user_id);
    return {
      userId: item.user_id,
      username: profile?.username || '',
      displayName: profile?.display_name || profile?.username || 'Membro',
      requestedAt: item.joined_at,
    };
  });
}

export async function resolveCommunityMembershipRequest(
  communityId: string,
  userId: string,
  approve: boolean,
): Promise<CommunityMembershipResult | null> {
  const now = new Date().toISOString();
  const update = await database()
    .from('community_members')
    .update({
      status: approve ? 'active' : 'rejected',
      joined_at: approve ? now : undefined,
      updated_at: now,
    })
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .eq('moderation_status', 'clear')
    .select('user_id')
    .maybeSingle();
  if (update.error) throw new Error(update.error.message);
  if (!update.data) return null;
  return membershipResult(communityId, userId);
}
