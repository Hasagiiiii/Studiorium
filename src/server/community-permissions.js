const { db, fail } = require('./db');
const { requireUser } = require('./auth');
const { inputError, resolveCommunity } = require('./community-links');

const ROLE_PERMISSIONS = {
  member: ['participate'],
  curator: ['participate', 'curate_content'],
  moderator: ['participate', 'moderate_content', 'moderate_members'],
  leader: [
    'participate',
    'curate_content',
    'moderate_content',
    'moderate_members',
    'manage_roles',
    'manage_rules',
  ],
};

function permissionsFor(role, isAdmin = false) {
  if (isAdmin) return [...new Set(Object.values(ROLE_PERMISSIONS).flat())];
  return ROLE_PERMISSIONS[role] || [];
}

async function membershipFor(communityId, userId) {
  const query = await db()
    .from('community_members')
    .select('community_id,user_id,role,status,joined_at')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();
  fail(query.error);
  return query.data || null;
}

async function communityActor(req, slug) {
  const user = await requireUser(req);
  const community = await resolveCommunity(slug);
  if (community.storageReady === false) {
    throw inputError('As comunidades ainda não estão ativas no banco deste ambiente.', 503);
  }
  const membership = await membershipFor(community.id, user.id);
  const isAdmin = user.role === 'admin';
  const role = membership?.status === 'active' ? membership.role : null;
  return {
    user,
    community,
    membership,
    role,
    isAdmin,
    permissions: permissionsFor(role, isAdmin),
  };
}

async function requireCommunityPermission(req, slug, permission) {
  const actor = await communityActor(req, slug);
  if (!actor.permissions.includes(permission)) {
    throw inputError('Você não tem permissão para administrar esta comunidade.', 403);
  }
  return actor;
}

module.exports = {
  ROLE_PERMISSIONS,
  permissionsFor,
  membershipFor,
  communityActor,
  requireCommunityPermission,
};
