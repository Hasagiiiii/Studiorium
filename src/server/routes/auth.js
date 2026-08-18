const { db, fail } = require('../db');
const { config } = require('../config');
const { readJson, setSessionCookie, parseCookies } = require('../http');
const { id, now, slugify, hashPassword, verifyPassword, token, tokenHash } = require('../security');
const { publicUser } = require('../auth');

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

  const userId = id('usr');
  const isMinor = year - birthYear < 18;
  const role = config().adminEmail && email === config().adminEmail ? 'admin' : 'user';
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
  return { status: 201, body: { user: await publicUser({ id: userId, email, role, is_minor: isMinor, created_at: now() }) } };
}

async function login(req, res) {
  const body = await readJson(req);
  const email = String(body.email || '').trim().toLowerCase();
  const { data: user, error } = await db().from('users').select('*').eq('email', email).maybeSingle();
  fail(error);
  if (!user || !verifyPassword(String(body.password || ''), user.password_hash)) {
    throw Object.assign(new Error('E-mail ou senha incorretos.'), { statusCode: 401 });
  }
  if ((user.status || 'active') === 'suspended') {
    throw Object.assign(new Error('Esta conta está suspensa. Entre em contato com a administração.'), { statusCode: 403 });
  }
  if (config().adminEmail && user.email === config().adminEmail && user.role !== 'admin') {
    await db().from('users').update({ role: 'admin' }).eq('id', user.id);
    user.role = 'admin';
  }
  await createSession(user.id, res);
  return { status: 200, body: { user: await publicUser(user) } };
}

async function logout(req, res) {
  const raw = parseCookies(req).studiorium_session;
  if (raw) await db().from('sessions').delete().eq('token_hash', tokenHash(raw));
  setSessionCookie(res, '', 0);
  return { status: 200, body: { ok: true } };
}

module.exports = { register, login, logout };
