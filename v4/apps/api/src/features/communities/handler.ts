import {
  findCommunityMembership,
  findCommunityMembershipTarget,
  joinPublicCommunity,
  leaveCommunity,
} from '@lorion/database';
import type { CommunityMembershipResult } from '@lorion/contracts';
import { requireSessionUser } from '../../auth/session.js';
import type { ApiRequest } from '../../core/http/types.js';
import { forbidden, HttpError, notFound } from '../../core/http/errors.js';

function normalizedSlug(value: string): string {
  return decodeURIComponent(value || '').trim().toLowerCase();
}

export async function joinCommunity(
  request: ApiRequest,
  rawSlug: string,
): Promise<CommunityMembershipResult> {
  const user = await requireSessionUser(request);
  const slug = normalizedSlug(rawSlug);
  if (!slug) throw notFound('Comunidade não encontrada.');

  const community = await findCommunityMembershipTarget(slug);
  if (!community || community.status !== 'active' || community.deleted_at) {
    throw notFound('Comunidade não encontrada.');
  }
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

export async function leaveCommunityMembership(
  request: ApiRequest,
  rawSlug: string,
): Promise<CommunityMembershipResult> {
  const user = await requireSessionUser(request);
  const slug = normalizedSlug(rawSlug);
  if (!slug) throw notFound('Comunidade não encontrada.');

  const community = await findCommunityMembershipTarget(slug);
  if (!community || community.status !== 'active' || community.deleted_at) {
    throw notFound('Comunidade não encontrada.');
  }

  const membership = await findCommunityMembership(community.id, user.id);
  if (!membership) {
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
