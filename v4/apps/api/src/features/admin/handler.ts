import {
  decideModerationReport,
  grantUserRole,
  listAdminAudit,
  listAdminUsers,
  listEditorialNewsQueue,
  listModerationReports,
  listNewsContributorApplications,
  listPendingResearchReview,
  listRolesWithPermissions,
  listVerificationRequests,
  revokeUserRole,
  setUserStatus,
  userPermissions,
  writeAdminAudit,
} from '@lorion/database';
import {
  adminDashboardSchema,
  adminMutationResultSchema,
  reportDecisionInputSchema,
  roleMutationInputSchema,
  userStatusInputSchema,
  type AdminDashboard,
} from '@lorion/contracts';
import { requireAnyPermission, requirePermission } from '../../auth/authorization.js';
import { readJson } from '../../core/http/body.js';
import { badRequest, forbidden, notFound } from '../../core/http/errors.js';
import type { ApiRequest } from '../../core/http/types.js';

const DASHBOARD_PERMISSIONS = [
  'admin.full',
  'moderation.queue',
  'moderation.content',
  'content.curate',
  'content.edit',
  'users.manage',
  'roles.manage',
] as const;

function mapReport(row: Record<string, unknown>) {
  return {
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
  };
}

function mapVerification(row: Record<string, unknown>) {
  return {
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
  };
}

function mapAudit(row: Record<string, unknown>) {
  return {
    id: typeof row.id === 'number' ? row.id : String(row.id),
    adminId: row.admin_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    details: row.details && typeof row.details === 'object' ? row.details : {},
    createdAt: row.created_at,
  };
}

export async function adminDashboard(request: ApiRequest): Promise<AdminDashboard> {
  const user = await requireAnyPermission(request, DASHBOARD_PERMISSIONS);
  const permissions = await userPermissions(user.id);
  const canManageUsers = permissions.includes('admin.full') || permissions.includes('users.manage');
  const canManageRoles = permissions.includes('admin.full') || permissions.includes('roles.manage');
  const canCurate = permissions.includes('admin.full') || permissions.includes('content.curate');
  const canModerate =
    permissions.includes('admin.full') ||
    permissions.includes('moderation.queue') ||
    permissions.includes('moderation.content');
  const [
    reports,
    verificationRequests,
    researchReviewQueue,
    newsContributorApplications,
    newsEditorialQueue,
    users,
    roles,
    audit,
  ] = await Promise.all([
    canModerate ? listModerationReports() : Promise.resolve([]),
    canManageUsers ? listVerificationRequests('pending') : Promise.resolve([]),
    canCurate ? listPendingResearchReview() : Promise.resolve([]),
    canCurate ? listNewsContributorApplications('pending') : Promise.resolve([]),
    canCurate ? listEditorialNewsQueue() : Promise.resolve([]),
    canManageUsers ? listAdminUsers() : Promise.resolve([]),
    canManageRoles ? listRolesWithPermissions() : Promise.resolve([]),
    permissions.includes('admin.full') ? listAdminAudit(200) : Promise.resolve([]),
  ]);
  return adminDashboardSchema.parse({
    permissions,
    reports: reports.map((row) => mapReport(row as Record<string, unknown>)),
    verificationRequests: verificationRequests.map((row) =>
      mapVerification(row as Record<string, unknown>),
    ),
    researchReviewQueue,
    newsContributorApplications,
    newsEditorialQueue,
    users,
    roles,
    audit: audit.map((row) => mapAudit(row as Record<string, unknown>)),
  });
}

export async function reviewReport(request: ApiRequest, reportId: string) {
  const moderator = await requirePermission(request, 'moderation.content');
  const parsed = reportDecisionInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Decisão de moderação inválida.');
  const updated = await decideModerationReport(reportId, parsed.data.status, parsed.data.note);
  if (!updated) throw notFound('Denúncia não encontrada.');
  await writeAdminAudit({
    adminId: moderator.id,
    action: 'moderation.report',
    targetType: 'report',
    targetId: reportId,
    details: { status: parsed.data.status, note: parsed.data.note },
  });
  return adminMutationResultSchema.parse({ ok: true });
}

export async function changeUserStatus(request: ApiRequest, targetUserId: string) {
  const admin = await requirePermission(request, 'users.manage');
  if (admin.id === targetUserId) {
    throw forbidden('Você não pode suspender ou reativar a própria conta por esta tela.');
  }
  const parsed = userStatusInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Estado da conta inválido.');
  if (parsed.data.status === 'suspended' && parsed.data.reason.length < 5) {
    throw badRequest('Informe o motivo da suspensão.');
  }
  if (!(await setUserStatus(targetUserId, parsed.data.status, parsed.data.reason))) {
    throw notFound('Usuário não encontrado.');
  }
  await writeAdminAudit({
    adminId: admin.id,
    action: parsed.data.status === 'suspended' ? 'user.suspend' : 'user.reactivate',
    targetType: 'user',
    targetId: targetUserId,
    details: { reason: parsed.data.reason },
  });
  return adminMutationResultSchema.parse({ ok: true });
}

export async function changeUserRole(
  request: ApiRequest,
  targetUserId: string,
  grant: boolean,
) {
  const admin = await requirePermission(request, 'roles.manage');
  const parsed = roleMutationInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Cargo inválido.');
  if (targetUserId === admin.id && parsed.data.roleId === 'admin' && !grant) {
    throw forbidden('Você não pode remover o próprio cargo de administrador por esta tela.');
  }
  if (grant) await grantUserRole(targetUserId, parsed.data.roleId, admin.id);
  else if (!(await revokeUserRole(targetUserId, parsed.data.roleId))) {
    throw notFound('Cargo não encontrado para o usuário.');
  }
  await writeAdminAudit({
    adminId: admin.id,
    action: grant ? 'role.grant' : 'role.revoke',
    targetType: 'user',
    targetId: targetUserId,
    details: { roleId: parsed.data.roleId },
  });
  return adminMutationResultSchema.parse({ ok: true });
}
