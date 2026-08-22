const { db } = require('./db');

const LEGACY_ROLE_PERMISSIONS = Object.freeze({
  user: ['content.read'],
  curator: ['content.read', 'content.curate'],
  editor: ['content.read', 'content.curate', 'content.edit'],
  moderator: ['content.read', 'moderation.queue', 'moderation.content'],
  admin: [
    'content.read',
    'content.curate',
    'content.edit',
    'moderation.queue',
    'moderation.content',
    'users.manage',
    'roles.manage',
    'settings.manage',
    'admin.full',
  ],
});

const BUILT_IN_ROLES = new Set(Object.keys(LEGACY_ROLE_PERMISSIONS));

function legacyAuthorization(user) {
  const role = user?.role || 'user';
  const permissions = LEGACY_ROLE_PERMISSIONS[role] || LEGACY_ROLE_PERMISSIONS.user;
  return { roles: [role], permissions: [...permissions], source: 'legacy' };
}

function deniedAuthorization(source = 'error') {
  return { roles: [], permissions: [], source };
}

function isMissingRbacTable(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  return code === '42P01' || /user_roles|role_permissions|schema cache/i.test(message);
}

function effectiveRoleIds(user, assignments = []) {
  const primaryRole = user?.role || 'user';
  const customRoles = assignments
    .map((row) => row.role_id)
    .filter((roleId) => roleId && !BUILT_IN_ROLES.has(roleId));
  return [...new Set([primaryRole, ...customRoles])];
}

async function authorizationFor(user) {
  if (!user?.id) return deniedAuthorization('none');

  const fallback = legacyAuthorization(user);
  const client = db();
  const assignments = await client.from('user_roles').select('role_id').eq('user_id', user.id);

  if (assignments.error) {
    if (isMissingRbacTable(assignments.error)) return fallback;
    console.warn('[Studiorium RBAC assignments]', assignments.error.message);
    return deniedAuthorization();
  }

  const roleIds = effectiveRoleIds(user, assignments.data || []);
  const grants = await client
    .from('role_permissions')
    .select('permission_id')
    .in('role_id', roleIds);

  if (grants.error) {
    if (isMissingRbacTable(grants.error)) return fallback;
    console.warn('[Studiorium RBAC grants]', grants.error.message);
    return deniedAuthorization();
  }

  const permissionIds = (grants.data || []).map((row) => row.permission_id).filter(Boolean);
  return { roles: roleIds, permissions: [...new Set(permissionIds)], source: 'rbac' };
}

async function hasPermission(user, permission) {
  const authorization = await authorizationFor(user);
  return authorization.permissions.includes(permission);
}

async function hasAnyRole(user, allowedRoles = []) {
  const authorization = await authorizationFor(user);
  return authorization.roles.some((role) => allowedRoles.includes(role));
}

async function syncLegacyPrimaryRole(userId, roleId, grantedBy = null) {
  const managedRoles = [...BUILT_IN_ROLES];
  const roleTable = db().from('user_roles');
  const remove = await roleTable.delete().eq('user_id', userId).in('role_id', managedRoles);

  if (remove.error) {
    if (!isMissingRbacTable(remove.error)) {
      console.warn('[Studiorium RBAC sync remove]', remove.error.message);
    }
    return false;
  }

  const assignment = {
    user_id: userId,
    role_id: roleId,
    granted_by: grantedBy || null,
  };
  const insert = await roleTable.insert(assignment);

  if (insert.error) {
    if (!isMissingRbacTable(insert.error)) {
      console.warn('[Studiorium RBAC sync insert]', insert.error.message);
    }
    return false;
  }

  return true;
}

module.exports = {
  LEGACY_ROLE_PERMISSIONS,
  legacyAuthorization,
  effectiveRoleIds,
  authorizationFor,
  hasPermission,
  hasAnyRole,
  syncLegacyPrimaryRole,
};
