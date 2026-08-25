import {
  createCommunityDiscussion,
  findCommunityMembership,
  findCommunityMembershipTarget,
  findDiscussionById,
  joinPublicCommunity,
  leaveCommunity,
  listCommunityDiscussions,
  listCommunityMembers,
  listCommunitySocialPosts,
  listPendingCommunityMembershipRequests,
  requestRestrictedCommunity,
  resolveCommunityMembershipRequest,
  toPublicUser,
} from '@lorion/database';
import {
  communityHubSchema,
  type CommunityHub,
  type CommunityMembershipRequest,
  type CommunityMembershipResult,
  type Discussion,
} from '@lorion/contracts';
import { communityCapabilities } from '@lorion/domain';
import { requireSessionUser, sessionUser } from '../../auth/session.js';
import { readJson } from '../../core/http/body.js';
import type { ApiRequest } from '../../core/http/types.js';
import { badRequest, forbidden, HttpError, notFound } from '../../core/http/errors.js';
import { entityId } from '../../core/security/token.js';

function normalizedSlug(value: string): string {
  try {
    return decodeURIComponent(value || '').trim().toLowerCase();
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

function accessFor(visibility: string, membership: Awaited<ReturnType<typeof findCommunityMembership>>) {
  return communityCapabilities({
    visibility,
    membershipStatus: membership?.status,
    moderationStatus: membership?.moderation_status,
    role: membership?.role,
  });
}

async function requireCommunityModerator(request: ApiRequest, communityId: string, visibility: string) {
  const user = await requireSessionUser(request);
  const membership = await findCommunityMembership(communityId, user.id);
  if (!accessFor(visibility, membership).canModerateMembershipRequests) {
    throw forbidden('Você não pode gerenciar solicitações desta comunidade.');
  }
  return user;
}

export async function communityHub(request: ApiRequest, rawSlug: string): Promise<CommunityHub> {
  const community = await activeCommunity(rawSlug);
  const viewer = await sessionUser(request);
  const membership = viewer ? await findCommunityMembership(community.id, viewer.id) : null;
  const access = accessFor(community.visibility, membership);

  if (!access.canReadHub) throw forbidden('Entre na comunidade para acessar membros e discussões.');

  const [members, posts, discussions] = await Promise.all([
    listCommunityMembers(community.id),
    listCommunitySocialPosts(community.id, viewer?.id),
    listCommunityDiscussions(community.id),
  ]);

  return communityHubSchema.parse({ members, posts, discussions, canCreateDiscussion: access.canCreateDiscussion });
}

export async function createDiscussionInCommunity(request: ApiRequest, rawSlug: string): Promise<Discussion> {
  const user = await requireSessionUser(request);
  const community = await activeCommunity(rawSlug);
  const membership = await findCommunityMembership(community.id, user.id);
  if (!accessFor(community.visibility, membership).canCreateDiscussion) {
    throw forbidden('Você precisa ser membro ativo para publicar nesta comunidade.');
  }

  const body = await readJson(request);
  const title = String(body.title || '').trim();
  const content = String(body.body || '').trim();
  const category = String(body.category || 'Geral').trim() || 'Geral';
  if (title.length < 3 || title.length > 160) throw badRequest('O título precisa ter entre 3 e 160 caracteres.');
  if (content.length < 1 || content.length > 8000) throw badRequest('A discussão precisa ter entre 1 e 8000 caracteres.');
  if (category.length > 60) throw badRequest('A categoria é muito longa.');

  const publicUser = await toPublicUser(user);
  const discussionId = entityId('dsc');
  const created = await createCommunityDiscussion({
    communityId: community.id,
    discussionId,
    authorId: user.id,
    authorName: publicUser?.displayName || user.email.split('@')[0] || 'Membro',
    title,
    body: content,
    category,
  });
  if (!created) throw forbidden('Não foi possível publicar nesta comunidade.');

  const discussion = await findDiscussionById(discussionId);
  if (!discussion) throw new Error('Discussão criada, mas não encontrada após persistência.');
  return discussion;
}

export async function joinCommunity(request: ApiRequest, rawSlug: string): Promise<CommunityMembershipResult> {
  const user = await requireSessionUser(request);
  const community = await activeCommunity(rawSlug);
  if (community.visibility !== 'public') throw forbidden('Esta comunidade exige aprovação para entrada.');

  const membership = await findCommunityMembership(community.id, user.id);
  if (membership?.moderation_status === 'removed') {
    throw new HttpError(403, 'Sua participação nesta comunidade foi removida pela moderação.', 'COMMUNITY_MEMBERSHIP_REMOVED');
  }
  return joinPublicCommunity(community.id, user.id, membership);
}

export async function requestCommunityMembership(request: ApiRequest, rawSlug: string): Promise<CommunityMembershipResult> {
  const user = await requireSessionUser(request);
  const community = await activeCommunity(rawSlug);
  if (community.visibility === 'public') throw new HttpError(409, 'Esta comunidade é pública. Entre diretamente.', 'COMMUNITY_IS_PUBLIC');
  if (community.visibility === 'private') throw forbidden('Esta comunidade não aceita solicitações públicas de entrada.');

  const membership = await findCommunityMembership(community.id, user.id);
  if (membership?.moderation_status === 'removed') {
    throw new HttpError(403, 'Sua participação nesta comunidade foi removida pela moderação.', 'COMMUNITY_MEMBERSHIP_REMOVED');
  }
  if (membership?.status === 'active') throw new HttpError(409, 'Você já participa desta comunidade.', 'ALREADY_A_COMMUNITY_MEMBER');
  return requestRestrictedCommunity(community.id, user.id, membership);
}

export async function pendingCommunityMembershipRequests(request: ApiRequest, rawSlug: string): Promise<CommunityMembershipRequest[]> {
  const community = await activeCommunity(rawSlug);
  await requireCommunityModerator(request, community.id, community.visibility);
  return listPendingCommunityMembershipRequests(community.id);
}

export async function decideCommunityMembershipRequest(
  request: ApiRequest,
  rawSlug: string,
  rawUserId: string,
  approve: boolean,
): Promise<CommunityMembershipResult> {
  const community = await activeCommunity(rawSlug);
  await requireCommunityModerator(request, community.id, community.visibility);
  let userId = '';
  try { userId = decodeURIComponent(rawUserId || '').trim(); } catch { throw notFound('Solicitação não encontrada.'); }
  if (!userId) throw notFound('Solicitação não encontrada.');

  const result = await resolveCommunityMembershipRequest(community.id, userId, approve);
  if (!result) throw notFound('Solicitação pendente não encontrada.');
  return result;
}

export async function leaveCommunityMembership(request: ApiRequest, rawSlug: string): Promise<CommunityMembershipResult> {
  const user = await requireSessionUser(request);
  const community = await activeCommunity(rawSlug);
  const membership = await findCommunityMembership(community.id, user.id);
  if (!membership || membership.status !== 'active') throw new HttpError(409, 'Você não participa desta comunidade.', 'NOT_A_COMMUNITY_MEMBER');
  if (membership.role === 'leader') throw new HttpError(409, 'Transfira a liderança antes de sair da comunidade.', 'COMMUNITY_LEADER_CANNOT_LEAVE');
  if (!accessFor(community.visibility, membership).canLeaveCommunity) {
    throw new HttpError(403, 'Sua participação nesta comunidade foi removida pela moderação.', 'COMMUNITY_MEMBERSHIP_REMOVED');
  }
  return leaveCommunity(community.id, user.id, membership);
}
