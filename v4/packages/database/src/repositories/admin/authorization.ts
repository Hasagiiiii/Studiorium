import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

export async function userPermissions(userId: string): Promise<string[]> {
  const roles = queryList(
    await database().from('user_roles').select('role_id').eq('user_id', userId),
  ) as Array<{ role_id: string }>;
  if (!roles.length) return ['content.read'];
  const result = await database()
    .from('role_permissions')
    .select('permission_id')
    .in('role_id', roles.map((role) => role.role_id));
  const permissions = queryList(result) as Array<{ permission_id: string }>;
  return [...new Set(permissions.map((row) => row.permission_id))];
}

export async function userHasPermission(userId: string, permission: string): Promise<boolean> {
  const permissions = await userPermissions(userId);
  return permissions.includes('admin.full') || permissions.includes(permission);
}

export async function listRolesWithPermissions() {
  const [rolesResult, permissionsResult] = await Promise.all([
    database().from('roles').select('*').order('rank', { ascending: false }),
    database().from('role_permissions').select('role_id,permission_id'),
  ]);
  const roles = queryList(rolesResult) as Array<Record<string, unknown>>;
  const links = queryList(permissionsResult) as Array<{ role_id: string; permission_id: string }>;
  return roles.map((role) => ({
    id: String(role.id),
    name: String(role.name),
    rank: Number(role.rank || 0),
    isSystem: role.is_system === true,
    permissions: links.filter((link) => link.role_id === role.id).map((link) => link.permission_id),
  }));
}
