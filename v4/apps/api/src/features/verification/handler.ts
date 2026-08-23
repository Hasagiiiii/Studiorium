import {
  completeProfileVerification,
  createNotification,
  createVerificationRequest,
  deleteVerificationRequest,
  findProfileByUserId,
  findVerificationRequest,
  setProfileVerificationPending,
  writeAdminAudit,
} from '@lorion/database';
import {
  submitVerificationInputSchema,
  verificationDecisionInputSchema,
  verificationDecisionResultSchema,
  verificationRequestSchema,
  type VerificationDecisionResult,
  type VerificationRequest,
} from '@lorion/contracts';
import { requirePermission } from '../../auth/authorization.js';
import { publicSessionUser, requireSessionUser } from '../../auth/session.js';
import { readJson } from '../../core/http/body.js';
import { badRequest, HttpError, notFound } from '../../core/http/errors.js';
import type { ApiRequest } from '../../core/http/types.js';
import { assertPublishableText } from '../../core/moderation/text.js';
import { entityId } from '../../core/security/token.js';

function mapRequest(row: Record<string, unknown>): VerificationRequest {
  return verificationRequestSchema.parse({
    id: row.id,
    userId: row.user_id,
    profileType: row.profile_type,
    course: row.course,
    institution: row.institution,
    educationLevel: row.education_level,
    specialty: row.specialty,
    credentialReference: row.credential_reference,
    statement: row.statement,
    status: row.status,
    reviewerId: row.reviewer_id,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function optionalCredentialUrl(value: string): string {
  if (!value) return '';
  try {
    const parsed = new URL(value);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) {
      throw new Error('invalid');
    }
    return parsed.toString().slice(0, 500);
  } catch {
    throw badRequest('Informe um link de comprovação válido.');
  }
}

export async function submitVerification(request: ApiRequest): Promise<VerificationRequest> {
  const user = await requireSessionUser(request);
  if (user.is_minor) {
    throw new HttpError(
      403,
      'Verificação profissional está disponível para maiores de 18 anos.',
      'MINOR_VERIFICATION_FORBIDDEN',
    );
  }
  const parsed = submitVerificationInputSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    throw badRequest('Informe curso, instituição, especialidade e uma descrição mais completa.');
  }
  assertPublishableText(parsed.data.statement, 'Solicitação de verificação');
  const credentialReference = optionalCredentialUrl(parsed.data.credentialReference);
  const profile = await findProfileByUserId(user.id);
  if (!profile) throw notFound('Perfil não encontrado.');
  if (profile.verificationStatus === 'verified') {
    throw new HttpError(409, 'Este perfil já está verificado.', 'PROFILE_ALREADY_VERIFIED');
  }

  const requestId = entityId('vrf');
  const row = await createVerificationRequest({
    id: requestId,
    userId: user.id,
    profileType: profile.profileType,
    course: parsed.data.course,
    institution: parsed.data.institution,
    educationLevel: parsed.data.educationLevel,
    specialty: parsed.data.specialty,
    credentialReference,
    statement: parsed.data.statement,
  });
  try {
    if (
      !(await setProfileVerificationPending({
        userId: user.id,
        course: parsed.data.course,
        institution: parsed.data.institution,
        educationLevel: parsed.data.educationLevel,
      }))
    ) {
      throw notFound('Perfil não encontrado.');
    }
  } catch (cause) {
    await deleteVerificationRequest(requestId).catch(() => undefined);
    throw cause;
  }
  return mapRequest(row as Record<string, unknown>);
}

export async function decideVerification(
  request: ApiRequest,
  requestId: string,
): Promise<VerificationDecisionResult> {
  const reviewer = await requirePermission(request, 'users.manage');
  const parsed = verificationDecisionInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Decisão de verificação inválida.');
  const current = await findVerificationRequest(requestId);
  if (!current || current.status !== 'pending') throw notFound('Solicitação não encontrada.');

  const userId = await completeProfileVerification({
    requestId,
    reviewerId: reviewer.id,
    status: parsed.data.status,
    note: parsed.data.note,
    contributionStatus: parsed.data.contributionStatus,
  });
  if (!userId) throw new HttpError(409, 'Solicitação já analisada.', 'VERIFICATION_ALREADY_REVIEWED');

  await createNotification({
    id: entityId('ntf'),
    userId,
    type: 'verification',
    title: parsed.data.status === 'approved' ? 'Perfil verificado' : 'Verificação precisa de revisão',
    message:
      parsed.data.status === 'approved'
        ? `Seu perfil recebeu o selo de especialista em ${String(current.specialty || 'sua área')}.`
        : parsed.data.note || 'A administração pediu que você revise as informações enviadas.',
    link: (await publicSessionUser(request))?.username
      ? `/perfil/${encodeURIComponent(String((await publicSessionUser(request))?.username || ''))}`
      : '/',
  }).catch((cause) => console.error('[Lorion v4 verification notification]', cause));

  await writeAdminAudit({
    adminId: reviewer.id,
    action: 'profile.verification',
    targetType: 'profile',
    targetId: userId,
    details: {
      requestId,
      status: parsed.data.status,
      contributionStatus: parsed.data.contributionStatus,
    },
  });

  return verificationDecisionResultSchema.parse({ ok: true, status: parsed.data.status, userId });
}
