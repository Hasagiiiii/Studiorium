import {
  createNotification,
  createResearchDraft,
  findOwnedResearch,
  listOwnedResearch,
  purgeResearch,
  restoreResearch,
  reviewResearch,
  softDeleteResearch,
  submitResearchForReview,
  updateResearchDraft,
  writeAdminAudit,
} from '@lorion/database';
import {
  publicationDeleteResultSchema,
  publicationReviewInputSchema,
  publicationSchema,
  researchDraftInputSchema,
  researchWorkspaceSchema,
  type Publication,
  type PublicationDeleteResult,
  type ResearchWorkspace,
} from '@lorion/contracts';
import { publicSessionUser, requireSessionUser } from '../../auth/session.js';
import { requirePermission } from '../../auth/authorization.js';
import { readJson } from '../../core/http/body.js';
import { badRequest, HttpError, notFound } from '../../core/http/errors.js';
import { assertPublishableText } from '../../core/moderation/text.js';
import type { ApiRequest } from '../../core/http/types.js';
import { entityId } from '../../core/security/token.js';

function decodeId(value: string): string {
  try {
    return decodeURIComponent(value || '').trim();
  } catch {
    return '';
  }
}

export async function researchWorkspace(request: ApiRequest): Promise<ResearchWorkspace> {
  const user = await requireSessionUser(request);
  const [publications, trash] = await Promise.all([
    listOwnedResearch(user.id, false),
    listOwnedResearch(user.id, true),
  ]);
  return researchWorkspaceSchema.parse({ publications, trash });
}

export async function createResearch(request: ApiRequest): Promise<Publication> {
  const user = await requireSessionUser(request);
  const parsed = researchDraftInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise os dados da pesquisa.');
  const publicUser = await publicSessionUser(request);
  return publicationSchema.parse(
    await createResearchDraft({
      id: entityId('pub'),
      ownerId: user.id,
      authorName: user.is_minor
        ? 'Autor protegido'
        : (publicUser?.displayName || publicUser?.username || 'Autor'),
      draft: parsed.data,
    }),
  );
}

export async function updateResearch(
  request: ApiRequest,
  rawPublicationId: string,
): Promise<Publication> {
  const user = await requireSessionUser(request);
  const publicationId = decodeId(rawPublicationId);
  if (!publicationId) throw notFound('Pesquisa não encontrada.');
  const parsed = researchDraftInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise os dados da pesquisa.');
  const updated = await updateResearchDraft(publicationId, user.id, parsed.data);
  if (!updated) {
    const current = await findOwnedResearch(publicationId, user.id);
    if (current?.status === 'pending_review') {
      throw new HttpError(409, 'A pesquisa está em revisão e não pode ser editada agora.', 'RESEARCH_IN_REVIEW');
    }
    throw notFound('Pesquisa não encontrada.');
  }
  return publicationSchema.parse(updated);
}

export async function submitResearch(request: ApiRequest, rawPublicationId: string): Promise<Publication> {
  const user = await requireSessionUser(request);
  const publicationId = decodeId(rawPublicationId);
  if (!publicationId) throw notFound('Pesquisa não encontrada.');
  const current = await findOwnedResearch(publicationId, user.id);
  if (!current || current.deletedAt) throw notFound('Pesquisa não encontrada.');
  if (current.title.trim().length < 6 || current.abstract.trim().length < 40) {
    throw badRequest('Complete um título com pelo menos 6 caracteres e um resumo com pelo menos 40 caracteres.');
  }
  assertPublishableText(`${current.title}\n${current.abstract}\n${current.content}`, 'Pesquisa');
  if (!(await submitResearchForReview(publicationId, user.id))) {
    throw new HttpError(409, 'A pesquisa já está em análise ou não pode ser enviada.', 'RESEARCH_NOT_SUBMITTED');
  }
  const updated = await findOwnedResearch(publicationId, user.id);
  if (!updated) throw new Error('Pesquisa enviada, mas não encontrada após atualização.');
  return publicationSchema.parse(updated);
}

export async function deleteResearch(
  request: ApiRequest,
  rawPublicationId: string,
): Promise<PublicationDeleteResult> {
  const user = await requireSessionUser(request);
  const publicationId = decodeId(rawPublicationId);
  if (!publicationId || !(await softDeleteResearch(publicationId, user.id))) {
    throw new HttpError(409, 'Pesquisa não encontrada ou está em revisão.', 'RESEARCH_NOT_DELETED');
  }
  return publicationDeleteResultSchema.parse({ ok: true, publicationId });
}

export async function restoreDeletedResearch(
  request: ApiRequest,
  rawPublicationId: string,
): Promise<PublicationDeleteResult> {
  const user = await requireSessionUser(request);
  const publicationId = decodeId(rawPublicationId);
  if (!publicationId || !(await restoreResearch(publicationId, user.id))) {
    throw notFound('Pesquisa não encontrada na lixeira.');
  }
  return publicationDeleteResultSchema.parse({ ok: true, publicationId });
}

export async function purgeDeletedResearch(
  request: ApiRequest,
  rawPublicationId: string,
): Promise<PublicationDeleteResult> {
  const user = await requireSessionUser(request);
  const publicationId = decodeId(rawPublicationId);
  if (!publicationId || !(await purgeResearch(publicationId, user.id))) {
    throw notFound('Pesquisa não encontrada na lixeira.');
  }
  return publicationDeleteResultSchema.parse({ ok: true, publicationId });
}

export async function decideResearchReview(
  request: ApiRequest,
  rawPublicationId: string,
): Promise<Publication> {
  const reviewer = await requirePermission(request, 'content.curate');
  const publicationId = decodeId(rawPublicationId);
  if (!publicationId) throw notFound('Pesquisa não encontrada.');
  const parsed = publicationReviewInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Decisão editorial inválida.');
  const updated = await reviewResearch(publicationId, parsed.data);
  if (!updated) throw notFound('Pesquisa não encontrada.');
  await writeAdminAudit({
    adminId: reviewer.id,
    action: 'research.review',
    targetType: 'publication',
    targetId: publicationId,
    details: parsed.data,
  });
  await createNotification({
    id: entityId('ntf'),
    userId: updated.ownerId,
    type: 'publication',
    title: parsed.data.status === 'published' ? 'Pesquisa publicada' : 'Revisão da pesquisa atualizada',
    message:
      parsed.data.status === 'published'
        ? `“${updated.title}” foi aprovada e já está pública.`
        : parsed.data.note || `O status de “${updated.title}” foi atualizado.`,
    link: parsed.data.status === 'published' ? `/pesquisas/${encodeURIComponent(updated.slug)}` : '/pesquisas/gerenciar',
  }).catch((cause) => console.error('[Lorion v4 research notification]', cause));
  return publicationSchema.parse(updated);
}
