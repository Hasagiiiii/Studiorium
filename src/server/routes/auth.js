const { db, fail } = require('../db');
const { config } = require('../config');
const { readJson, setSessionCookie, parseCookies } = require('../http');
const { id, now, slugify, hashPassword, verifyPassword, token, tokenHash } = require('../security');
const { publicUser, requireUser } = require('../auth');
const { assertAuthAllowed, recordAuthFailure, clearAuthFailures, logSecurityEvent } = require('../security-events');

async function uniqueUsername(displayName) {
  const base = slugify(displayName).replace(/-/g, '').slice(0, 24) || 'estudante';
  for (let n = 1; n < 1000; n++) {
    const candidate = n === 1 ? base : `${base}${n}`;
    const { data, error } = await db().from('profiles').select('user_id').eq('username', candidate).maybeSingle();
    if (error) fail(error);
    if (!data) return candidate;
  }
  return `${base}${Date.now().toString(36)}`;
}

async function createSession(userId, res) {
  await db().from('sessions').delete().lt('expires_at', new Date().toISOString());
  const raw = token();
  const expires = new Date(Date.now() + config().sessionDays * 86400000).toISOString();
  const { error } = await db().from('sessions').insert({ token_hash: tokenHash(raw), user_id: userId, expires_at: expires, created_at: now() });
  fail(error);
  setSessionCookie(res, raw, config().sessionDays * 86400);
}

async function register(req, res) {
  const { data: registrationSetting } = await db().from('site_settings').select('value').eq('key', 'registrations_open').maybeSingle();
  if (registrationSetting && registrationSetting.value === false) throw Object.assign(new Error('Novos cadastros estão temporariamente pausados.'), { statusCode: 403 });
  const body = await readJson(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const birthYear = Number(body.birthYear);
  const displayName = String(body.displayName || '').trim().slice(0, 80);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw Object.assign(new Error('Informe um e-mail válido.'), { statusCode: 400 });
  if (password.length < 8 || password.length > 128) throw Object.assign(new Error('A senha precisa ter entre 8 e 128 caracteres.'), { statusCode: 400 });
  const year = new Date().getFullYear();
  if (!Number.isInteger(birthYear) || birthYear < 1930 || birthYear > year) throw Object.assign(new Error('Ano de nascimento inválido.'), { statusCode: 400 });
  if (displayName.length < 2) throw Object.assign(new Error('Informe seu nome de exibição.'), { statusCode: 400 });
  const { data: existing, error: existingError } = await db().from('users').select('id').eq('email', email).maybeSingle();
  fail(existingError);
  if (existing) throw Object.assign(new Error('Este e-mail já está cadastrado.'), { statusCode: 409 });

  if (config().adminEmail && email === config().adminEmail) {
    await logSecurityEvent(req, 'admin.registration_blocked', { email });
    throw Object.assign(new Error('A conta administradora principal já é provisionada pelo sistema.'), { statusCode: 403 });
  }

  const userId = id('usr');
  const isMinor = year - birthYear < 18;
  const role = 'user';
  const username = await uniqueUsername(displayName);
  const { error: userError } = await db().from('users').insert({
    id: userId, email, password_hash: hashPassword(password), role,
    is_minor: isMinor, birth_year: birthYear, created_at: now(),
  });
  fail(userError);
  const { error: profileError } = await db().from('profiles').insert({
    user_id: userId, username, display_name: displayName, bio: '', profile_type: 'estudante',
    is_public: !isMinor, created_at: now(),
  });
  if (profileError) {
    await db().from('users').delete().eq('id', userId);
    fail(profileError);
  }
  await createSession(userId, res);
  await logSecurityEvent(req, 'account.registered', { userId, email, details: { role, isMinor } });
  return { status: 201, body: { user: await publicUser({ id: userId, email, role, is_minor: isMinor, created_at: now() }) } };
}

async function login(req, res) {
  const body = await readJson(req);
  const email = String(body.email || '').trim().toLowerCase();
  await assertAuthAllowed(req, 'login', email);

  const { data: user, error } = await db().from('users').select('*').eq('email', email).maybeSingle();
  fail(error);
  if (!user || !verifyPassword(String(body.password || ''), user.password_hash)) {
    const limit = await recordAuthFailure(req, 'login', email, { maxAttempts: 8, windowMs: 15 * 60 * 1000, blockMs: 15 * 60 * 1000 });
    await logSecurityEvent(req, 'auth.login_failed', { email, details: { attempts: limit.attempts, blocked: limit.blocked } });
    if (limit.blocked) {
      throw Object.assign(new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.'), { statusCode: 429 });
    }
    throw Object.assign(new Error('E-mail ou senha incorretos.'), { statusCode: 401 });
  }
  if ((user.status || 'active') === 'suspended') {
    await logSecurityEvent(req, 'auth.login_suspended', { userId: user.id, email });
    throw Object.assign(new Error('Esta conta está suspensa. Entre em contato com a administração.'), { statusCode: 403 });
  }
  await clearAuthFailures(req, 'login', email);
  await createSession(user.id, res);
  await logSecurityEvent(req, 'auth.login_success', { userId: user.id, email, details: { role: user.role } });
  return { status: 200, body: { user: await publicUser(user) } };
}

async function changePassword(req, res) {
  const user = await requireUser(req);
  const body = await readJson(req);
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');
  if (newPassword.length < 12 || newPassword.length > 128) {
    throw Object.assign(new Error('A nova senha precisa ter entre 12 e 128 caracteres.'), { statusCode: 400 });
  }
  const { data: account, error } = await db().from('users').select('password_hash,email').eq('id', user.id).maybeSingle();
  fail(error);
  if (!account || !verifyPassword(currentPassword, account.password_hash)) {
    await logSecurityEvent(req, 'auth.password_change_failed', { userId: user.id, email: user.email });
    throw Object.assign(new Error('A senha atual está incorreta.'), { statusCode: 401 });
  }
  if (verifyPassword(newPassword, account.password_hash)) {
    throw Object.assign(new Error('Escolha uma senha diferente da atual.'), { statusCode: 400 });
  }
  const { error: updateError } = await db().from('users').update({ password_hash: hashPassword(newPassword) }).eq('id', user.id);
  fail(updateError);
  await db().from('sessions').delete().eq('user_id', user.id);
  await createSession(user.id, res);
  await logSecurityEvent(req, 'auth.password_changed', { userId: user.id, email: user.email });
  return { status: 200, body: { ok: true } };
}

async function logout(req, res) {
  const raw = parseCookies(req).studiorium_session;
  if (raw) await db().from('sessions').delete().eq('token_hash', tokenHash(raw));
  setSessionCookie(res, '', 0);
  return { status: 200, body: { ok: true } };
}

module.exports = { register, login, changePassword, logout };
