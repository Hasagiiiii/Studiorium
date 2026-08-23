import type { ApiResponse } from './types.js';

export const SESSION_COOKIE = 'studiorium_session';

export function setSessionCookie(response: ApiResponse, value: string, maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const encoded = encodeURIComponent(value);
  response.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}${secure}`,
  );
}
