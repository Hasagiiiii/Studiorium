import {
  assertLoginAllowed,
  clearLoginFailures,
  createAccount,
  createSessionRecord,
  deleteSessionByHash,
  findAccountByEmail,
  loadSiteSettings,
  toPublicUser,
  usernameExists,
} from '@lorion/database';
import type { AuthUserResponse, OkResponse } from '@lorion/contracts';
import type { ApiRequest, ApiResponse } from '../../core/http/types.js';
import { readJson } from '../../core/http/body.js';
import { parseCookies } from '../../core/http/cookies.js';
import { SESSION_COOKIE, setSessionCookie } from '../../core/http/session-cookie.js';
import { badRequest, forbidden, HttpError } from '../../core/http/errors.js';
import { hashSessionToken } from '../../core/security/hash.js';
import { hashPassword, verifyPassword } from '../../core/security/password.js';
import { entityId, opaqueToken, slugify } from '../../core/security/token.js';
import { recordLoginFailure } from '@lorion/database';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function sessionDays(): number {
  const parsed = Number(process.env.SESSION_DAYS || 14);
  return Number.isFinite(parsed) ? Math.min(90, Math.max(1, Math.floor(parsed))) : 14;
}

async function uniqueUsername(displayName: string): Promise<string> {
  const base = slugify(displayName).replace(/-/g, '').slice(0, 24) || 'membro';
  for (let index = 1; index < 1000; index += 1) {
    const candidate = index === 1 ? base : `${base}${index}`;
    if (!(await usernameExists(candidate))) return candidate;
  }
  return `${base}${Date.now().toString(36)}`;
}

async function openSession(userId: string, response: ApiResponse) {
  const rawToken = opaqueToken();
  const days = sessionDays();
  await createSessionRecord({
    userId,
    tokenHash: hashSessionToken(rawToken),
    expiresAt: new Date(Date.now() + days * 86_400_000).toISOString(),
  });
  setSessionCookie(response, rawToken, days * 86_400);
}

export async function login(request: ApiRequest, response: ApiResponse): Promise<AuthUserResponse> {
  const body = await readJson(request);
  const email = String(body.email || '')
    .trim()
    .toLowerCase();
  const password = String(body.password || '');
  if (!EMAIL_PATTERN.test(email) || !password)
    throw new HttpError(401, 'E-mail ou senha incorretos.', 'INVALID_CREDENTIALS');

  const rateKey = `login:${hashSessionToken(email)}`;
  await assertLoginAllowed(rateKey);
  const account = await findAccountByEmail(email);
  if (!account || !verifyPassword(password, account.password_hash)) {
    const blocked = await recordLoginFailure(rateKey);
    if (blocked)
      throw new HttpError(
        429,
        'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        'RATE_LIMITED',
      );
    throw new HttpError(401, 'E-mail ou senha incorretos.', 'INVALID_CREDENTIALS');
  }
  if (account.status === 'suspended') throw forbidden('Esta conta está suspensa.');

  await clearLoginFailures(rateKey);
  await openSession(account.id, response);
  return { user: await toPublicUser(account) };
}

export async function register(
  request: ApiRequest,
  response: ApiResponse,
): Promise<AuthUserResponse> {
  const settings = await loadSiteSettings();
  if (!settings.registrations_open)
    throw forbidden('Novos cadastros estão temporariamente pausados.');

  const body = await readJson(request);
  const email = String(body.email || '')
    .trim()
    .toLowerCase();
  const password = String(body.password || '');
  const displayName = String(body.displayName || '')
    .trim()
    .slice(0, 80);
  const birthYear = Number(body.birthYear);
  const currentYear = new Date().getFullYear();

  if (!EMAIL_PATTERN.test(email)) throw badRequest('Informe um e-mail válido.');
  if (password.length < 12 || password.length > 128)
    throw badRequest('A senha precisa ter entre 12 e 128 caracteres.');
  if (displayName.length < 2) throw badRequest('Informe seu nome de exibição.');
  if (!Number.isInteger(birthYear) || birthYear < 1930 || birthYear > currentYear)
    throw badRequest('Ano de nascimento inválido.');

  const adminEmail = String(process.env.ADMIN_EMAIL || '')
    .trim()
    .toLowerCase();
  if (adminEmail && email === adminEmail)
    throw forbidden('Esta conta é provisionada pela administração.');
  if (await findAccountByEmail(email))
    throw new HttpError(409, 'Este e-mail já está cadastrado.', 'EMAIL_IN_USE');

  const userId = entityId('usr');
  const username = await uniqueUsername(displayName);
  const isMinor = currentYear - birthYear < 18;
  await createAccount({
    id: userId,
    email,
    passwordHash: hashPassword(password),
    birthYear,
    isMinor,
    username,
    displayName,
  });
  await openSession(userId, response);
  return {
    user: await toPublicUser({ id: userId, email, role: 'user', status: 'active' }),
  };
}

export async function logout(request: ApiRequest, response: ApiResponse): Promise<OkResponse> {
  const raw = parseCookies(request)[SESSION_COOKIE];
  if (raw) await deleteSessionByHash(hashSessionToken(raw));
  setSessionCookie(response, '', 0);
  return { ok: true };
}
