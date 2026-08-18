const { db, fail } = require('./db');
const { tokenHash, now } = require('./security');

function requestIpHash(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const raw = forwarded || String(req.headers['x-real-ip'] || '') || String(req.socket?.remoteAddress || 'unknown');
  return tokenHash(raw);
}

function identityHash(identity) {
  return tokenHash(String(identity || '').trim().toLowerCase());
}

function limiterKey(req, scope, identity) {
  return tokenHash(`${scope}:${requestIpHash(req)}:${identityHash(identity)}`);
}

async function readLimiter(key) {
  const { data, error } = await db().from('auth_rate_limits').select('*').eq('key', key).maybeSingle();
  fail(error);
  return data;
}

function tooManyRequests(retryAfterSeconds = 900) {
  const err = new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
  err.statusCode = 429;
  err.retryAfter = Math.max(1, Math.ceil(retryAfterSeconds));
  return err;
}

async function assertAuthAllowed(req, scope, identity, options = {}) {
  const key = limiterKey(req, scope, identity);
  const row = await readLimiter(key);
  if (!row?.blocked_until) return;
  const remainingMs = new Date(row.blocked_until).getTime() - Date.now();
  if (remainingMs > 0) throw tooManyRequests(remainingMs / 1000);
}

async function recordAuthFailure(req, scope, identity, options = {}) {
  const maxAttempts = Number(options.maxAttempts || 8);
  const windowMs = Number(options.windowMs || 15 * 60 * 1000);
  const blockMs = Number(options.blockMs || 15 * 60 * 1000);
  const key = limiterKey(req, scope, identity);
  const existing = await readLimiter(key);
  const current = Date.now();
  const stale = !existing?.window_started_at || current - new Date(existing.window_started_at).getTime() > windowMs;
  const attempts = (stale ? 0 : Number(existing?.attempts || 0)) + 1;
  const blockedUntil = attempts >= maxAttempts ? new Date(current + blockMs).toISOString() : null;
  const row = {
    key,
    scope,
    attempts,
    window_started_at: stale ? new Date(current).toISOString() : existing.window_started_at,
    blocked_until: blockedUntil,
    updated_at: now(),
  };
  const { error } = await db().from('auth_rate_limits').upsert(row, { onConflict: 'key' });
  fail(error);
  return { attempts, blocked: Boolean(blockedUntil), blockedUntil };
}

async function clearAuthFailures(req, scope, identity) {
  const key = limiterKey(req, scope, identity);
  const { error } = await db().from('auth_rate_limits').delete().eq('key', key);
  fail(error);
}

async function logSecurityEvent(req, event, { userId = null, email = '', details = {} } = {}) {
  try {
    const cleanDetails = details && typeof details === 'object' && !Array.isArray(details) ? details : {};
    const { error } = await db().from('security_events').insert({
      event: String(event || 'unknown').slice(0, 80),
      user_id: userId || null,
      email_hash: email ? identityHash(email) : null,
      ip_hash: requestIpHash(req),
      details: cleanDetails,
      created_at: now(),
    });
    if (error) console.error('[Studiorium security event]', error.message || error);
  } catch (error) {
    console.error('[Studiorium security event]', error.message || error);
  }
}

module.exports = {
  assertAuthAllowed,
  recordAuthFailure,
  clearAuthFailures,
  logSecurityEvent,
};
