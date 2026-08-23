import {
  createModerationReport,
  findOpenDuplicateReport,
  findUserIdByUsername,
  reportTargetExists,
  setSafetyControl,
} from '@lorion/database';
import {
  createReportInputSchema,
  createReportResultSchema,
  safetyControlResultSchema,
  type CreateReportResult,
  type SafetyControlKind,
  type SafetyControlResult,
} from '@lorion/contracts';
import { requireSessionUser } from '../../auth/session.js';
import { readJson } from '../../core/http/body.js';
import { badRequest, HttpError, notFound } from '../../core/http/errors.js';
import type { ApiRequest } from '../../core/http/types.js';
import { entityId } from '../../core/security/token.js';

function decode(value: string): string {
  try {
    return decodeURIComponent(value || '').trim();
  } catch {
    return '';
  }
}

export async function setProfileSafetyControl(
  request: ApiRequest,
  rawUsername: string,
  kind: SafetyControlKind,
  enabled: boolean,
): Promise<SafetyControlResult> {
  const user = await requireSessionUser(request);
  const username = decode(rawUsername);
  if (!username) throw notFound('Perfil não encontrado.');
  const targetUserId = await findUserIdByUsername(username);
  if (!targetUserId) throw notFound('Perfil não encontrado.');
  if (targetUserId === user.id) throw badRequest('Você não pode aplicar esse controle ao próprio perfil.');
  if (!(await setSafetyControl(user.id, targetUserId, kind, enabled))) {
    throw new HttpError(409, 'Não foi possível atualizar esse controle.', 'SAFETY_CONTROL_NOT_CHANGED');
  }
  return safetyControlResultSchema.parse({ targetUserId, kind, enabled });
}

export async function createReport(request: ApiRequest): Promise<CreateReportResult> {
  const user = await requireSessionUser(request);
  const parsed = createReportInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise o alvo, a categoria e a descrição da denúncia.');
  if (!(await reportTargetExists(parsed.data.targetType, parsed.data.targetId))) {
    throw notFound('O conteúdo denunciado não foi encontrado ou não está disponível.');
  }
  if (await findOpenDuplicateReport(user.id, parsed.data.targetType, parsed.data.targetId)) {
    throw new HttpError(409, 'Você já possui uma denúncia aberta para este alvo.', 'REPORT_EXISTS');
  }
  const row = await createModerationReport(entityId('rep'), user.id, parsed.data);
  return createReportResultSchema.parse({
    report: {
      id: row.id,
      reporterId: row.reporter_id,
      targetType: row.target_type,
      targetId: row.target_id,
      category: row.category,
      description: row.description,
      status: row.status,
      priority: row.priority,
      moderatorNote: row.moderator_note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  });
}
