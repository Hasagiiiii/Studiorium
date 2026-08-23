import type { ApiResponse } from './types.js';

export const SESSION_COOKIE = 'studiorium_session';

function shouldUseSecureCookie(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

export function setSessionCookie(response: ApiResponse, value: string, maxAgeSeconds: number) {
  const secure = shouldUseSecureCookie() ? '; Secure' : '';
  const encoded = encodeURIComponent(value);
  response.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}${secure}`,
  );
}
