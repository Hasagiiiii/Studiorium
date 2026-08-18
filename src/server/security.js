const crypto = require('crypto');

function now() { return new Date().toISOString(); }
function id(prefix) { return `${prefix}_${crypto.randomUUID()}`; }
function slugify(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'sem-titulo';
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  try {
    const [salt, expectedHex] = String(stored || '').split(':');
    if (!salt || !expectedHex) return false;
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = crypto.scryptSync(password, salt, expected.length);
    return expected.length > 0 && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
function token() { return crypto.randomBytes(32).toString('hex'); }
function tokenHash(value) { return crypto.createHash('sha256').update(String(value)).digest('hex'); }
function safeText(value, max = 500) { return String(value || '').trim().slice(0, max); }

module.exports = { now, id, slugify, hashPassword, verifyPassword, token, tokenHash, safeText };
