import type { ApiRequest } from '../core/http/types.js';
import { forbidden } from '../core/http/errors.js';

export function assertSameOrigin(request: ApiRequest) {
  const method = String(request.method || 'GET').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return;

  const fetchSite = request.headers['sec-fetch-site'];
  const site = Array.isArray(fetchSite) ? fetchSite[0] : fetchSite;
  if (site === 'cross-site') throw forbidden('Origem da requisição não autorizada.');

  const origin = request.headers.origin;
  if (!origin) return;

  const forwardedHost = request.headers['x-forwarded-host'];
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || request.headers.host;
  if (!host) throw forbidden('Host da requisição não identificado.');

  try {
    if (new URL(origin).host !== host) throw forbidden('Origem da requisição não autorizada.');
  } catch (error) {
    if (error instanceof Error && 'status' in error) throw error;
    throw forbidden('Origem inválida.');
  }
}
