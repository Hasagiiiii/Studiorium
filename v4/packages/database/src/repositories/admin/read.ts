import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

export async function listVerificationRequests(status = 'pending') {
  const result = await database()
    .from('profile_verification_requests')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: true })
    .limit(200);
  return queryList(result);
}

export async function findVerificationRequest(requestId: string) {
  const result = await database()
    .from('profile_verification_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data || null;
}

export async function listAdminUsers() {
  const users = queryList(
    await database()
      .from('users')
      .select('id,email,role,status,suspension_reason,suspended_at,is_minor,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(500),
  ) as Array<Record<string, unknown>>;
  if (!users.length) return [];
  const ids = users.map((user) => String(user.id));
  const [profilesResult, userRolesResult] = await Promise.all([
    database()
      .from('profiles')
      .select('user_id,username,display_name,verification_status,verified_specialty')
      .in('user_id', ids),
    database().from('user_roles').select('user_id,role_id').in('user_id', ids),
  ]);
  const profiles = queryList(profilesResult) as Array<Record<string, unknown>>;
  const userRoles = queryList(userRolesResult) as Array<{ user_id: string; role_id: string }>;
  const byId = new Map(profiles.map((profile) => [String(profile.user_id), profile]));
  return users.map((user) => {
    const id = String(user.id);
    const profile = byId.get(id);
    return {
      id,
      email: String(user.email),
      role: String(user.role),
      status: String(user.status),
      suspensionReason: String(user.suspension_reason || ''),
      suspendedAt: user.suspended_at || null,
      isMinor: user.is_minor === true,
      username: profile ? String(profile.username || '') : '',
      displayName: profile ? String(profile.display_name || '') : '',
      verificationStatus: profile ? String(profile.verification_status || 'unverified') : 'unverified',
      verifiedSpecialty: profile ? String(profile.verified_specialty || '') : '',
      roles: userRoles.filter((entry) => entry.user_id === id).map((entry) => entry.role_id),
      createdAt: user.created_at || null,
      updatedAt: user.updated_at || null,
    };
  });
}

export async function listAdminAudit(limit = 200) {
  const result = await database()
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return queryList(result);
}
