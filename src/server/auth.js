const { db } = require('./db');
const { parseCookies } = require('./http');
const { tokenHash } = require('./security');
const { authorizationFor } = require('./authorization');

async function currentUser(req) {
  const rawToken = parseCookies(req).studiorium_session;
  if (!rawToken) return null;
  const hash = tokenHash(rawToken);
  const { data: session, error } = await db()
    .from('sessions')
    .select('user_id,expires_at')
    .eq('token_hash', hash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error || !session) return null;
  const { data: user, error: userError } = await db()
    .from('users')
    .select('*')
    .eq('id', session.user_id)
    .maybeSingle();
  if (userError || !user) return null;
  if ((user.status || 'active') === 'suspended') return null;
  return user;
}

async function requireUser(req) {
  const user = await currentUser(req);
  if (!user) {
    const err = new Error('Faça login para continuar.');
    err.statusCode = 401;
    throw err;
  }
  return user;
}

async function requirePermission(
  req,
  permission,
  message = 'Você não tem permissão para esta ação.',
) {
  const user = await requireUser(req);
  const authorization = await authorizationFor(user);
  if (!authorization.permissions.includes(permission)) {
    const err = new Error(message);
    err.statusCode = 403;
    throw err;
  }
  return user;
}

async function requireAdmin(req) {
  return requirePermission(req, 'admin.full', 'Acesso restrito à administração.');
}

async function requireStaff(req, allowedRoles = ['moderator', 'curator', 'editor', 'admin']) {
  const user = await requireUser(req);
  const authorization = await authorizationFor(user);
  const allowedByRole = authorization.roles.some((role) => allowedRoles.includes(role));
  const allowedByPermission = authorization.permissions.includes('moderation.queue');
  if (!allowedByRole && !allowedByPermission) {
    const err = new Error('Acesso restrito à equipe de moderação.');
    err.statusCode = 403;
    throw err;
  }
  return user;
}

async function publicUser(user) {
  if (!user) return null;
  const { data: profile } = await db()
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status || 'active',
    isMinor: user.is_minor,
    username: profile?.username || '',
    displayName: profile?.display_name || profile?.username || user.email.split('@')[0],
    bio: profile?.bio || '',
    profileType: profile?.profile_type || 'estudante',
    isPublic: profile?.is_public !== false,
    course: profile?.course || '',
    institution: profile?.institution || '',
    educationLevel: profile?.education_level || '',
    verificationStatus: profile?.verification_status || 'unverified',
    verifiedSpecialty: profile?.verified_specialty || '',
    contributionStatus: profile?.contribution_status || 'member',
    createdAt: user.created_at,
  };
}

module.exports = {
  currentUser,
  requireUser,
  requirePermission,
  requireAdmin,
  requireStaff,
  publicUser,
};
