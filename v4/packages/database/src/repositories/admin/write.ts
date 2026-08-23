import { database } from '../../core/client.js';

export async function completeProfileVerification(input: {
  requestId: string;
  reviewerId: string;
  status: 'approved' | 'rejected';
  note: string;
  contributionStatus: 'active_collaborator' | 'specialist';
}): Promise<string | null> {
  const result = await database().rpc('complete_profile_verification', {
    p_request_id: input.requestId,
    p_reviewer_id: input.reviewerId,
    p_status: input.status,
    p_note: input.note,
    p_contribution_status: input.contributionStatus,
  });
  if (result.error) throw new Error(result.error.message);
  return typeof result.data === 'string' && result.data ? result.data : null;
}

export async function setUserStatus(
  userId: string,
  status: 'active' | 'suspended',
  reason: string,
): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await database()
    .from('users')
    .update({
      status,
      suspension_reason: status === 'suspended' ? reason : '',
      suspended_at: status === 'suspended' ? now : null,
      updated_at: now,
    })
    .eq('id', userId)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (status === 'suspended' && result.data) {
    const sessions = await database().from('sessions').delete().eq('user_id', userId);
    if (sessions.error) throw new Error(sessions.error.message);
  }
  return Boolean(result.data);
}

export async function grantUserRole(userId: string, roleId: string, grantedBy: string): Promise<boolean> {
  const result = await database()
    .from('user_roles')
    .upsert(
      { user_id: userId, role_id: roleId, granted_by: grantedBy, granted_at: new Date().toISOString() },
      { onConflict: 'user_id,role_id' },
    );
  if (result.error) throw new Error(result.error.message);
  return true;
}

export async function revokeUserRole(userId: string, roleId: string): Promise<boolean> {
  const result = await database()
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .select('user_id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function writeAdminAudit(input: {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const result = await database().from('admin_audit_log').insert({
    admin_id: input.adminId,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId,
    details: input.details || {},
  });
  if (result.error) throw new Error(result.error.message);
}
