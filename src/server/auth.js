const { db } = require('./db');
const { parseCookies } = require('./http');
const { tokenHash } = require('./security');
const { config } = require('./config');

async function currentUser(req) {
  const rawToken = parseCookies(req).studiorium_session;
  if (!rawToken) return null;
  const hash = tokenHash(rawToken);
  const { data: session, error } = await db().from('sessions').select('user_id,expires_at').eq('token_hash', hash).gt('expires_at', new Date().toISOString()).maybeSingle();
  if (error || !session) return null;
  const { data: user, error: userError } = await db().from('users').select('*').eq('id', session.user_id).maybeSingle();
  if (userError || !user) return null;
  if ((user.status || 'active') === 'suspended') return null;
  if (config().adminEmail && user.email === config().adminEmail && user.role !== 'admin') {
    await db().from('users').update({ role: 'admin' }).eq('id', user.id);
    user.role = 'admin';
  }
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

async function requireAdmin(req) {
  const user = await requireUser(req);
  if (user.role !== 'admin') {
    const err = new Error('Acesso restrito à administração.');
    err.statusCode = 403;
    throw err;
  }
  return user;
}

async function publicUser(user) {
  if (!user) return null;
  const { data: profile } = await db().from('profiles').select('*').eq('user_id', user.id).maybeSingle();
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
    createdAt: user.created_at,
  };
}

module.exports = { currentUser, requireUser, requireAdmin, publicUser };
