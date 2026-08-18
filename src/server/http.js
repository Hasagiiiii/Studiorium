const { config } = require('./config');

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(
    raw
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf('=');
        if (i < 0) return [part, ''];
        return [decodeURIComponent(part.slice(0, i)), decodeURIComponent(part.slice(i + 1))];
      }),
  );
}

function invalidJsonError() {
  const error = new Error('JSON inválido.');
  error.statusCode = 400;
  return error;
}

function payloadTooLargeError() {
  const error = new Error('Payload muito grande.');
  error.statusCode = 413;
  return error;
}

function parseJsonText(raw, maxBytes) {
  if (Buffer.byteLength(raw) > maxBytes) throw payloadTooLargeError();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw invalidJsonError();
  }
}

async function readJson(req) {
  const maxBytes = config().maxBodyBytes;

  if (Buffer.isBuffer(req.body)) {
    return parseJsonText(req.body.toString('utf8'), maxBytes);
  }

  if (typeof req.body === 'string') {
    return parseJsonText(req.body, maxBytes);
  }

  if (req.body && typeof req.body === 'object') {
    let serialized;
    try {
      serialized = JSON.stringify(req.body);
    } catch {
      throw invalidJsonError();
    }
    if (Buffer.byteLength(serialized) > maxBytes) throw payloadTooLargeError();
    return req.body;
  }

  return await new Promise((resolve, reject) => {
    let size = 0;
    let raw = '';
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(payloadTooLargeError());
        req.destroy();
        return;
      }
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(parseJsonText(raw, maxBytes));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function applyApiSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Frame-Options', 'DENY');
}

function send(res, status, body) {
  res.statusCode = status;
  applyApiSecurityHeaders(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function setSessionCookie(res, value, maxAge) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `studiorium_session=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}; Priority=High${secure}`,
  );
}

function assertSameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!origin || !host) return;
  try {
    if (new URL(origin).host !== host) {
      const err = new Error('Origem da requisição não autorizada.');
      err.statusCode = 403;
      throw err;
    }
  } catch (error) {
    if (error.statusCode) throw error;
    const err = new Error('Origem inválida.');
    err.statusCode = 403;
    throw err;
  }
}

module.exports = {
  parseCookies,
  readJson,
  send,
  setSessionCookie,
  assertSameOrigin,
  applyApiSecurityHeaders,
};
