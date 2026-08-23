import type { ApiRequest } from '../core/http/types.js';
import { forbidden } from '../core/http/errors.js';

export function assertSameOrigin(request: ApiRequest) {
  const method = String(request.method || 'GET').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return;

  const origin = request.headers.origin;
  const forwardedHost = request.headers['x-forwarded-host'];
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || request.headers.host;
  if (!origin || !host) return;

  try {
    if (new URL(origin).host !== host) throw forbidden('Origem da requisição não autorizada.');
  } catch (error) {
    if (error instanceof Error && 'status' in error) throw error;
    throw forbidden('Origem inválida.');
  }
}
