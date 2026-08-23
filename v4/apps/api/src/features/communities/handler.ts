import {
  findCommunityMembership,
  findCommunityMembershipTarget,
  joinPublicCommunity,
  leaveCommunity,
  listPendingCommunityMembershipRequests,
  requestRestrictedCommunity,
  resolveCommunityMembershipRequest,
} from '@lorion/database';
import type {
  CommunityMembershipRequest,
  CommunityMembershipResult,
} from '@lorion/contracts';
import { requireSessionUser } from '../../auth/session.js';
import type { ApiRequest } from '../../core/http/types.js';
import { forbidden, HttpError, notFound } from '../../core/http/errors.js';

function normalizedSlug(value: string): string {
  try {
    return decodeURIComponent(value || '')
      .trim()
      .toLowerCase();
  } catch {
    throw notFound('Comunidade não encontrada.');
  }
}

async function activeCommunity(rawSlug: string) {
  const slug = normalizedSlug(rawSlug);
  if (!slug) throw notFound('Comunidade não encontrada.');
  const community = await findCommunityMembershipTarget(slug);
  if (!community || community.status !== 'active' || community.deleted_at) {
    throw notFound('Comunidade não encontrada.');
  }
  return community;
}

async function requireCommunityModerator(request: ApiRequest, communityId: string) {
  const user = await requireSessionUser(request);
  const membership = await findCommunityMembership(communityId, user.id);
  const canModerate =
    membership?.status === 'active' &&
    membership.moderation_status !== 'removed' &&
    (membership.role === 'leader' || membership.role === 'moderator');
  if (!canModerate) throw forbidden('Você não pode gerenciar solicitações desta comunidade.');
  return user;
}

export async function joinCommunity(
  request: ApiRequest,
  rawSlug: string,
): Promise<CommunityMembershipResult> {
  const user = await requireSessionUser(request);
  const community = await activeCommunity(rawSlug);
  if (community.visibility !== 'public') {
    throw forbidden('Esta comunidade exige aprovação para entrada.');
  }

  const membership = await findCommunityMembership(community.id, user.id);
  if (membership?.moderation_status === 'removed') {
    throw new HttpError(
      403,
      'Sua participação nesta comunidade foi removida pela moderação.',
      'COMMUNITY_MEMBERSHIP_REMOVED',
    );
  }

  return joinPublicCommunity(community.id, user.id, membership);
}

export async function requestCommunityMembership(
  request: ApiRequest,
  rawSlug: string,
): Promise<CommunityMembershipResult> {
  const user = await requireSessionUser(request);
  const community = await activeCommunity(rawSlug);
  if (community.visibility === 'public') {
    throw new HttpError(409, 'Esta comunidade é pública. Entre diretamente.', 'COMMUNITY_IS_PUBLIC');
  }
  if (community.visibility === 'private') {
    throw forbidden('Esta comunidade não aceita solicitações públicas de entrada.');
  }

  const membership = await findCommunityMembership(community.id, user.id);
  if (membership?.moderation_status === 'removed') {
    throw new HttpError(
      403,
      'Sua participação nesta comunidade foi removida pela moderação.',
      'COMMUNITY_MEMBERSHIP_REMOVED',
    );
  }
  if (membership?.status === 'active') {
    throw new HttpError(409, 'Você já participa desta comunidade.', 'ALREADY_A_COMMUNITY_MEMBER');
  }

  return requestRestrictedCommunity(community.id, user.id, membership);
}

export async function pendingCommunityMembershipRequests(
  request: ApiRequest,
  rawSlug: string,
): Promise<CommunityMembershipRequest[]> {
  const community = await activeCommunity(rawSlug);
  await requireCommunityModerator(request, community.id);
  return listPendingCommunityMembershipRequests(community.id);
}

export async function decideCommunityMembershipRequest(
  request: ApiRequest,
  rawSlug: string,
  rawUserId: string,
  approve: boolean,
): Promise<CommunityMembershipResult> {
  const community = await activeCommunity(rawSlug);
  await requireCommunityModerator(request, community.id);
  const userId = decodeURIComponent(rawUserId || '').trim();
  if (!userId) throw notFound('Solicitação não encontrada.');

  const result = await resolveCommunityMembershipRequest(community.id, userId, approve);
  if (!result) throw notFound('Solicitação pendente não encontrada.');
  return result;
}

export async function leaveCommunityMembership(
  request: ApiRequest,
  rawSlug: string,
): Promise<CommunityMembershipResult> {
  const user = await requireSessionUser(request);
  const community = await activeCommunity(rawSlug);

  const membership = await findCommunityMembership(community.id, user.id);
  if (!membership || membership.status !== 'active') {
    throw new HttpError(409, 'Você não participa desta comunidade.', 'NOT_A_COMMUNITY_MEMBER');
  }
  if (membership.role === 'leader') {
    throw new HttpError(
      409,
      'Transfira a liderança antes de sair da comunidade.',
      'COMMUNITY_LEADER_CANNOT_LEAVE',
    );
  }
  if (membership.moderation_status === 'removed') {
    throw new HttpError(
      403,
      'Sua participação nesta comunidade foi removida pela moderação.',
      'COMMUNITY_MEMBERSHIP_REMOVED',
    );
  }

  return leaveCommunity(community.id, user.id, membership);
}
