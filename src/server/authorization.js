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
  return {
    roles: [role],
    permissions: [...(LEGACY_ROLE_PERMISSIONS[role] || LEGACY_ROLE_PERMISSIONS.user)],
    source: 'legacy',
  };
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
  if (!user?.id) return { roles: [], permissions: [], source: 'none' };

  const fallback = legacyAuthorization(user);
  const assignments = await db()
    .from('user_roles')
    .select('role_id')
    .eq('user_id', user.id);

  if (assignments.error) {
    if (!isMissingRbacTable(assignments.error)) {
      console.warn('[Studiorium RBAC assignments]', assignments.error.message);
    }
    return fallback;
  }

  const roleIds = effectiveRoleIds(user, assignments.data || []);
  const grants = await db()
    .from('role_permissions')
    .select('permission_id')
    .in('role_id', roleIds);

  if (grants.error) {
    if (!isMissingRbacTable(grants.error)) {
      console.warn('[Studiorium RBAC grants]', grants.error.message);
    }
    return fallback;
  }

  return {
    roles: roleIds,
    permissions: [
      ...new Set((grants.data || []).map((row) => row.permission_id).filter(Boolean)),
    ],
    source: 'rbac',
  };
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
  const remove = await db()
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .in('role_id', managedRoles);

  if (remove.error) {
    if (!isMissingRbacTable(remove.error)) {
      console.warn('[Studiorium RBAC sync remove]', remove.error.message);
    }
    return false;
  }

  const insert = await db()
    .from('user_roles')
    .insert({ user_id: userId, role_id: roleId, granted_by: grantedBy || null });

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
