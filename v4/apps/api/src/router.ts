import type { ApiRequest, ApiResponse } from './core/http/types.js';
import { HttpError, notFound } from './core/http/errors.js';
import { json, noContent } from './core/http/response.js';
import { assertSameOrigin } from './middleware/origin.js';
import { bootstrap } from './features/bootstrap/handler.js';
import { login, logout, register } from './features/auth/handler.js';
import {
  notifications,
  readAllNotifications,
  readNotification,
} from './features/notifications/handler.js';
import { followingFeed, myGraph, profileSocial, setFollow } from './features/social/handler.js';

function requestPath(request: ApiRequest): string {
  const host = request.headers.host || 'localhost';
  const url = new URL(request.url || '/', `http://${host}`);
  const rewritten = url.searchParams.get('path');
  if (rewritten) return rewritten.startsWith('/') ? rewritten : `/${rewritten}`;
  return url.pathname;
}

function methodOf(request: ApiRequest): string {
  return String(request.method || 'GET').toUpperCase();
}

async function route(request: ApiRequest, response: ApiResponse) {
  const method = methodOf(request);
  const path = requestPath(request);

  if (method === 'OPTIONS') return noContent(response);
  assertSameOrigin(request);

  if (method === 'GET' && path === '/api/v4/health') {
    return json(response, 200, { ok: true, version: '4.0.0-alpha.1' });
  }
  if (method === 'GET' && path === '/api/v4/bootstrap') {
    return json(response, 200, await bootstrap(request));
  }

  if (method === 'POST' && path === '/api/v4/auth/login') {
    return json(response, 200, await login(request, response));
  }
  if (method === 'POST' && path === '/api/v4/auth/register') {
    return json(response, 201, await register(request, response));
  }
  if (method === 'POST' && path === '/api/v4/auth/logout') {
    return json(response, 200, await logout(request, response));
  }

  if (method === 'GET' && path === '/api/v4/notifications') {
    return json(response, 200, await notifications(request));
  }
  if (method === 'POST' && path === '/api/v4/notifications/read-all') {
    return json(response, 200, await readAllNotifications(request));
  }
  const notificationReadMatch = path.match(/^\/api\/v4\/notifications\/([^/]+)\/read$/);
  if (notificationReadMatch && method === 'POST') {
    return json(
      response,
      200,
      await readNotification(request, decodeURIComponent(notificationReadMatch[1] || '')),
    );
  }

  if (method === 'GET' && path === '/api/v4/social/me') {
    return json(response, 200, await myGraph(request));
  }
  if (method === 'GET' && path === '/api/v4/social/feed') {
    return json(response, 200, await followingFeed(request));
  }

  const profileSocialMatch = path.match(/^\/api\/v4\/profiles\/([^/]+)\/social$/);
  if (profileSocialMatch && method === 'GET') {
    return json(
      response,
      200,
      await profileSocial(request, decodeURIComponent(profileSocialMatch[1] || '')),
    );
  }

  const followMatch = path.match(/^\/api\/v4\/profiles\/([^/]+)\/follow$/);
  if (followMatch && method === 'POST') {
    return json(
      response,
      200,
      await setFollow(request, decodeURIComponent(followMatch[1] || ''), true),
    );
  }
  if (followMatch && method === 'DELETE') {
    return json(
      response,
      200,
      await setFollow(request, decodeURIComponent(followMatch[1] || ''), false),
    );
  }

  throw notFound('Endpoint não encontrado.');
}

export async function handleApi(request: ApiRequest, response: ApiResponse) {
  try {
    await route(request, response);
  } catch (cause) {
    const record =
      cause && typeof cause === 'object' ? (cause as { status?: unknown; code?: unknown }) : {};
    const status =
      cause instanceof HttpError
        ? cause.status
        : typeof record.status === 'number'
          ? record.status
          : 500;
    const code =
      cause instanceof HttpError
        ? cause.code
        : typeof record.code === 'string'
          ? record.code
          : undefined;
    const publicMessage =
      status >= 500
        ? 'O serviço encontrou um erro inesperado.'
        : cause instanceof Error
          ? cause.message
          : 'Não foi possível concluir a solicitação.';

    if (status >= 500) console.error('[Lorion v4 API]', cause);
    json(response, status, code ? { error: publicMessage, code } : { error: publicMessage });
  }
}
