import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const API = `${Deno.env.get('SUPABASE_URL')}/functions/v1/studiorium-api`;
const ALLOWED_ORIGIN = 'https://hasagiiiii.github.io';

function cors(origin = '') {
  const headers = new Headers();
  if (origin === ALLOWED_ORIGIN) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type,X-Studiorium-Session');
  headers.set('Access-Control-Expose-Headers', 'Location');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return headers;
}

function sessionFromSetCookie(value: string | null) {
  if (!value) return '';
  const match = value.match(/(?:^|[,;]\s*)studiorium_session=([^;]+)/i);
  return match ? decodeURIComponent(match[1]) : '';
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (origin && origin !== ALLOWED_ORIGIN) {
    return Response.json({ error: 'Origem não autorizada.' }, { status: 403, headers: cors(origin) });
  }

  const url = new URL(req.url);
  const prefix = '/studiorium-api-web';
  const apiPath = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) || '/' : url.pathname;
  const target = API + apiPath + url.search;

  const forwardHeaders = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) forwardHeaders.set('Content-Type', contentType);
  const session = req.headers.get('x-studiorium-session');
  if (session) forwardHeaders.set('Cookie', `studiorium_session=${encodeURIComponent(session)}`);

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const upstream = await fetch(target, {
    method: req.method,
    headers: forwardHeaders,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: 'manual',
  });

  const responseHeaders = cors(origin);
  const location = upstream.headers.get('location');
  if (location) responseHeaders.set('Location', location);
  const upstreamType = upstream.headers.get('content-type');
  if (upstreamType) responseHeaders.set('Content-Type', upstreamType);

  if (upstream.status >= 300 && upstream.status < 400) {
    return new Response(null, { status: upstream.status, headers: responseHeaders });
  }

  const text = await upstream.text();
  const newSession = sessionFromSetCookie(upstream.headers.get('set-cookie'));
  if (newSession && (upstreamType || '').includes('application/json')) {
    let payload: Record<string, unknown> = {};
    try { payload = text ? JSON.parse(text) : {}; }
    catch { payload = { ok: upstream.ok }; }
    payload.sessionToken = newSession;
    return new Response(JSON.stringify(payload), { status: upstream.status, headers: responseHeaders });
  }

  return new Response(text, { status: upstream.status, headers: responseHeaders });
});
