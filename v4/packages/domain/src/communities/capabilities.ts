export type CommunityVisibility = 'public' | 'restricted' | 'private' | string;
export type CommunityMembershipStatus = 'active' | 'left' | 'pending' | 'rejected' | null | undefined;
export type CommunityMemberRole = 'leader' | 'moderator' | 'member' | string | null | undefined;
export type CommunityModerationStatus = 'clear' | 'removed' | string | null | undefined;

export type CommunityAccessContext = {
  visibility: CommunityVisibility;
  membershipStatus?: CommunityMembershipStatus;
  moderationStatus?: CommunityModerationStatus;
  role?: CommunityMemberRole;
};

export type CommunityCapabilities = {
  canReadHub: boolean;
  canCreateDiscussion: boolean;
  canModerateMembershipRequests: boolean;
  canLeaveCommunity: boolean;
};

export function communityCapabilities(
  context: CommunityAccessContext,
): CommunityCapabilities {
  const isActiveMember =
    context.membershipStatus === 'active' && context.moderationStatus !== 'removed';
  const isClearMember = isActiveMember && context.moderationStatus === 'clear';
  const canModerate =
    isActiveMember && (context.role === 'leader' || context.role === 'moderator');

  return {
    canReadHub: context.visibility === 'public' || isActiveMember,
    canCreateDiscussion: isClearMember,
    canModerateMembershipRequests: canModerate,
    canLeaveCommunity: isActiveMember && context.role !== 'leader',
  };
}
