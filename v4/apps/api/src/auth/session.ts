import { findUserBySessionHash, toPublicUser, type SessionUserRow } from '@lorion/database';
import type { PublicUser } from '@lorion/contracts';
import type { ApiRequest } from '../core/http/types.js';
import { parseCookies } from '../core/http/cookies.js';
import { SESSION_COOKIE } from '../core/http/session-cookie.js';
import { unauthorized } from '../core/http/errors.js';
import { hashSessionToken } from '../core/security/hash.js';

export async function sessionUser(request: ApiRequest): Promise<SessionUserRow | null> {
  const raw = parseCookies(request)[SESSION_COOKIE];
  if (!raw) return null;
  return findUserBySessionHash(hashSessionToken(raw));
}

export async function publicSessionUser(request: ApiRequest): Promise<PublicUser> {
  return toPublicUser(await sessionUser(request));
}

export async function requireSessionUser(request: ApiRequest): Promise<SessionUserRow> {
  const user = await sessionUser(request);
  if (!user) throw unauthorized();
  return user;
}
