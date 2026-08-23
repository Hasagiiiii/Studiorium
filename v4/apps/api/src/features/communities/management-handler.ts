import {
  communityMediaRecord,
  createManagedCommunity,
  findCommunityMediaById,
  findCommunityMembership,
  findCommunityMembershipTarget,
  findManagedCommunity,
  listManagedCommunityMembers,
  removeCommunityMediaObject,
  setCommunityMediaPath,
  signedCommunityMediaUrl,
  transferCommunityLeadership,
  updateCommunityMemberRecord,
  updateCommunityRecord,
  uploadCommunityMediaObject,
} from '@lorion/database';
import {
  communityLeadershipTransferInputSchema,
  communityManagementSchema,
  communityMediaKindSchema,
  communityMediaUploadInputSchema,
  communityMemberUpdateInputSchema,
  communitySchema,
  createCommunityInputSchema,
  updateCommunityInputSchema,
  type Community,
  type CommunityManagement,
} from '@lorion/contracts';
import { requireSessionUser, sessionUser } from '../../auth/session.js';
import { readJson } from '../../core/http/body.js';
import { badRequest, forbidden, HttpError, notFound } from '../../core/http/errors.js';
import { assertPublishableText } from '../../core/moderation/text.js';
import { validateProfileImage } from '../../core/security/image.js';
import { entityId } from '../../core/security/token.js';
import type { ApiRequest, ApiResponse } from '../../core/http/types.js';

function normalizedSlug(value: string): string {
  try {
    return decodeURIComponent(value || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

async function activeTarget(rawSlug: string) {
  const slug = normalizedSlug(rawSlug);
  const target = slug ? await findCommunityMembershipTarget(slug) : null;
  if (!target || target.status !== 'active' || target.deleted_at) throw notFound('Comunidade não encontrada.');
  return target;
}

async function managementActor(request: ApiRequest, communityId: string) {
  const user = await requireSessionUser(request);
  const membership = await findCommunityMembership(communityId, user.id);
  if (
    !membership ||
    membership.status !== 'active' ||
    membership.moderation_status === 'removed' ||
    !['leader', 'moderator'].includes(membership.role)
  ) {
    throw forbidden('Você não possui permissão para administrar esta comunidade.');
  }
  return { user, membership };
}

function moderateCommunityIdentity(input: { name: string; description: string; rules: string[] }) {
  assertPublishableText([input.name, input.description, ...input.rules].filter(Boolean).join('\n'), 'Comunidade');
}

export async function createCommunity(request: ApiRequest): Promise<Community> {
  const user = await requireSessionUser(request);
  const parsed = createCommunityInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise o nome, a descrição, as regras e a visibilidade.');
  moderateCommunityIdentity(parsed.data);
  return communitySchema.parse(
    await createManagedCommunity(entityId('com'), user.id, parsed.data),
  );
}

export async function communityManagement(
  request: ApiRequest,
  rawSlug: string,
): Promise<CommunityManagement> {
  const target = await activeTarget(rawSlug);
  const { user, membership } = await managementActor(request, target.id);
  const [community, members] = await Promise.all([
    findManagedCommunity(target.slug, user.id),
    listManagedCommunityMembers(target.id),
  ]);
  if (!community) throw notFound('Comunidade não encontrada.');
  return communityManagementSchema.parse({
    community,
    members,
    canEdit: membership.role === 'leader',
    canManageMembers: ['leader', 'moderator'].includes(membership.role),
    canTransferLeadership: membership.role === 'leader',
  });
}

export async function updateCommunity(
  request: ApiRequest,
  rawSlug: string,
): Promise<Community> {
  const target = await activeTarget(rawSlug);
  const { user, membership } = await managementActor(request, target.id);
  if (membership.role !== 'leader') throw forbidden('Somente o líder pode editar a identidade da comunidade.');
  const parsed = updateCommunityInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise os dados da comunidade.');
  moderateCommunityIdentity(parsed.data);
  if (!(await updateCommunityRecord(target.id, parsed.data))) throw notFound('Comunidade não encontrada.');
  const updated = await findManagedCommunity(target.slug, user.id);
  if (!updated) throw notFound('Comunidade não encontrada.');
  return communitySchema.parse(updated);
}

export async function updateCommunityMember(
  request: ApiRequest,
  rawSlug: string,
  rawUserId: string,
): Promise<CommunityManagement> {
  const target = await activeTarget(rawSlug);
  const { user, membership: actorMembership } = await managementActor(request, target.id);
  let userId = '';
  try {
    userId = decodeURIComponent(rawUserId || '').trim();
  } catch {
    throw notFound('Membro não encontrado.');
  }
  if (!userId || userId === user.id) throw badRequest('Use as ações da sua própria participação para alterar sua conta.');
  const targetMembership = await findCommunityMembership(target.id, userId);
  if (!targetMembership || targetMembership.status !== 'active') throw notFound('Membro ativo não encontrado.');
  if (targetMembership.role === 'leader') throw forbidden('A liderança só pode ser alterada por transferência explícita.');

  const parsed = communityMemberUpdateInputSchema.safeParse(await readJson(request));
  if (!parsed.success || (!parsed.data.role && !parsed.data.moderationStatus)) {
    throw badRequest('Informe uma alteração válida para o membro.');
  }
  if (actorMembership.role !== 'leader') {
    if (parsed.data.role) throw forbidden('Somente o líder pode alterar papéis da comunidade.');
    if (targetMembership.role === 'moderator') {
      throw forbidden('Moderadores não podem moderar outro moderador.');
    }
  }

  if (!(await updateCommunityMemberRecord(target.id, userId, parsed.data))) {
    throw notFound('Membro não encontrado ou protegido por regra de liderança.');
  }
  const community = await findManagedCommunity(target.slug, user.id);
  if (!community) throw notFound('Comunidade não encontrada.');
  return communityManagementSchema.parse({
    community,
    members: await listManagedCommunityMembers(target.id),
    canEdit: actorMembership.role === 'leader',
    canManageMembers: true,
    canTransferLeadership: actorMembership.role === 'leader',
  });
}

export async function transferLeadership(
  request: ApiRequest,
  rawSlug: string,
): Promise<CommunityManagement> {
  const target = await activeTarget(rawSlug);
  const { user, membership } = await managementActor(request, target.id);
  if (membership.role !== 'leader') throw forbidden('Somente o líder atual pode transferir a liderança.');
  const parsed = communityLeadershipTransferInputSchema.safeParse(await readJson(request));
  if (!parsed.success || parsed.data.userId === user.id) throw badRequest('Escolha outro membro ativo.');
  if (!(await transferCommunityLeadership(target.id, user.id, parsed.data.userId))) {
    throw new HttpError(409, 'O membro escolhido não está apto a receber a liderança.', 'LEADERSHIP_NOT_TRANSFERRED');
  }
  const community = await findManagedCommunity(target.slug, user.id);
  if (!community) throw notFound('Comunidade não encontrada.');
  return communityManagementSchema.parse({
    community,
    members: await listManagedCommunityMembers(target.id),
    canEdit: false,
    canManageMembers: true,
    canTransferLeadership: false,
  });
}

export async function uploadCommunityMedia(
  request: ApiRequest,
  rawSlug: string,
): Promise<Community> {
  const target = await activeTarget(rawSlug);
  const { user, membership } = await managementActor(request, target.id);
  if (membership.role !== 'leader') throw forbidden('Somente o líder pode alterar as imagens da comunidade.');
  const parsed = communityMediaUploadInputSchema.safeParse(await readJson(request, 5 * 1024 * 1024));
  if (!parsed.success) throw badRequest('Imagem da comunidade inválida.');
  const { kind, file } = parsed.data;
  const { ext, mime, bytes } = validateProfileImage(file);
  const previousPath = await findCommunityMediaById(target.id, kind);
  const storagePath = `${target.id}/${kind}${ext}`;
  await uploadCommunityMediaObject(storagePath, bytes, mime);
  try {
    if (!(await setCommunityMediaPath(target.id, kind, storagePath))) throw notFound('Comunidade não encontrada.');
  } catch (cause) {
    await removeCommunityMediaObject(storagePath).catch(() => undefined);
    throw cause;
  }
  if (previousPath && previousPath !== storagePath) {
    await removeCommunityMediaObject(previousPath).catch((cause) =>
      console.warn('[Lorion v4 community media cleanup]', cause),
    );
  }
  const community = await findManagedCommunity(target.slug, user.id);
  if (!community) throw notFound('Comunidade não encontrada.');
  return communitySchema.parse(community);
}

export async function removeCommunityMedia(
  request: ApiRequest,
  rawSlug: string,
  rawKind: string,
): Promise<Community> {
  const target = await activeTarget(rawSlug);
  const { user, membership } = await managementActor(request, target.id);
  if (membership.role !== 'leader') throw forbidden('Somente o líder pode alterar as imagens da comunidade.');
  const kind = communityMediaKindSchema.safeParse(rawKind);
  if (!kind.success) throw badRequest('Tipo de imagem inválido.');
  const previousPath = await findCommunityMediaById(target.id, kind.data);
  if (!(await setCommunityMediaPath(target.id, kind.data, null))) throw notFound('Comunidade não encontrada.');
  if (previousPath) {
    await removeCommunityMediaObject(previousPath).catch((cause) =>
      console.warn('[Lorion v4 community media remove]', cause),
    );
  }
  const community = await findManagedCommunity(target.slug, user.id);
  if (!community) throw notFound('Comunidade não encontrada.');
  return communitySchema.parse(community);
}

export async function serveCommunityMedia(
  request: ApiRequest,
  response: ApiResponse,
  rawSlug: string,
  rawKind: string,
): Promise<void> {
  const slug = normalizedSlug(rawSlug);
  const kind = communityMediaKindSchema.safeParse(rawKind);
  if (!slug || !kind.success) throw notFound('Imagem não encontrada.');
  const media = await communityMediaRecord(slug);
  if (!media || media.status !== 'active' || media.deletedAt) throw notFound('Imagem não encontrada.');
  const path = kind.data === 'avatar' ? media.avatarPath : media.coverPath;
  if (!path) throw notFound('Imagem não encontrada.');
  if (media.visibility === 'private') {
    const viewer = await sessionUser(request);
    const membership = viewer ? await findCommunityMembership(media.id, viewer.id) : null;
    if (!membership || membership.status !== 'active' || membership.moderation_status === 'removed') {
      throw notFound('Imagem não encontrada.');
    }
  }
  const url = await signedCommunityMediaUrl(path);
  response.statusCode = 302;
  response.setHeader('Cache-Control', 'private, max-age=60');
  response.setHeader('Location', url);
  response.end();
}
