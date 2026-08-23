import type { CommunityMembershipResult } from '@lorion/contracts';
import { database } from '../../core/client.js';

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
    .select('community_id,user_id,role,status,moderation_status')
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

  const membership = await findCommunityMembership(communityId, userId);
  return {
    communityId,
    joined: membership?.status === 'active' && membership.moderation_status !== 'removed',
    role: membership?.role || null,
    memberModerationStatus: membership?.moderation_status || null,
    memberCount: await activeMemberCount(communityId),
  };
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

  return {
    communityId,
    joined: false,
    role: current.role,
    memberModerationStatus: current.moderation_status,
    memberCount: await activeMemberCount(communityId),
  };
}
