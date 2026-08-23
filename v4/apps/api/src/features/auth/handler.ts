import {
  assertAuthRateLimitAllowed,
  assertLoginAllowed,
  clearAuthRateLimit,
  clearLoginFailures,
  completePasswordReset,
  createAccount,
  createPasswordResetToken,
  createSessionRecord,
  deleteExpiredPasswordResetTokens,
  deleteOutstandingPasswordResetTokens,
  deletePasswordResetToken,
  deleteSessionByHash,
  findAccountByEmail,
  loadSiteSettings,
  recordAuthRateLimitAttempt,
  recordLoginFailure,
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
import {
  isPasswordResetEmailConfigured,
  passwordResetSiteUrl,
  sendPasswordResetEmail,
} from './password-reset-email.js';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const RESET_TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const RESET_REQUEST_MESSAGE =
  'Se a conta existir, enviaremos um link de redefinição para o e-mail informado.';

const PASSWORD_RESET_REQUEST_POLICY = {
  scope: 'password-reset-request',
  maxAttempts: 4,
  windowMs: 60 * 60 * 1000,
  blockMs: 60 * 60 * 1000,
};

const PASSWORD_RESET_POLICY = {
  scope: 'password-reset',
  maxAttempts: 8,
  windowMs: 15 * 60 * 1000,
  blockMs: 15 * 60 * 1000,
};

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

  const adminEmail = String(
    process.env.STUDIORIUM_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '',
  )
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

export async function requestPasswordReset(request: ApiRequest): Promise<OkResponse> {
  if (!isPasswordResetEmailConfigured()) {
    throw new HttpError(
      503,
      'A recuperação de senha está temporariamente indisponível.',
      'PASSWORD_RESET_UNAVAILABLE',
    );
  }

  const body = await readJson(request);
  const email = String(body.email || '')
    .trim()
    .toLowerCase();
  const generic: OkResponse = { ok: true, message: RESET_REQUEST_MESSAGE };

  if (!EMAIL_PATTERN.test(email)) return generic;

  const rateKey = `password-reset-request:${hashSessionToken(email)}`;
  await assertAuthRateLimitAllowed(rateKey);
  await recordAuthRateLimitAttempt(rateKey, PASSWORD_RESET_REQUEST_POLICY);

  const account = await findAccountByEmail(email);
  if (!account || account.status === 'suspended') return generic;

  const nowIso = new Date().toISOString();
  await deleteOutstandingPasswordResetTokens(account.id);
  await deleteExpiredPasswordResetTokens(nowIso);

  const rawToken = opaqueToken();
  const tokenHash = hashSessionToken(rawToken);
  await createPasswordResetToken({
    tokenHash,
    userId: account.id,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });

  try {
    const resetUrl = `${passwordResetSiteUrl()}/redefinir-senha#token=${rawToken}`;
    await sendPasswordResetEmail({ to: account.email, resetUrl });
  } catch (cause) {
    await deletePasswordResetToken(tokenHash);
    const code =
      cause && typeof cause === 'object' && 'code' in cause
        ? String(cause.code)
        : 'EMAIL_ERROR';
    console.error('[Lorion v4 password reset email]', code);
  }

  return generic;
}

export async function resetPassword(request: ApiRequest): Promise<OkResponse> {
  const body = await readJson(request);
  const rawToken = String(body.token || '').trim();
  const newPassword = String(body.newPassword || '');
  const limiterIdentity = hashSessionToken(rawToken);
  const rateKey = `password-reset:${limiterIdentity}`;

  await assertAuthRateLimitAllowed(rateKey);

  if (!RESET_TOKEN_PATTERN.test(rawToken)) {
    throw new HttpError(410, 'Link inválido, expirado ou já utilizado.', 'RESET_LINK_INVALID');
  }
  if (newPassword.length < 12 || newPassword.length > 128) {
    throw badRequest('A nova senha precisa ter entre 12 e 128 caracteres.');
  }

  const completed = await completePasswordReset(limiterIdentity, hashPassword(newPassword));
  if (!completed) {
    const blocked = await recordAuthRateLimitAttempt(rateKey, PASSWORD_RESET_POLICY);
    throw new HttpError(
      blocked ? 429 : 410,
      blocked
        ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
        : 'Link inválido, expirado ou já utilizado.',
      blocked ? 'RATE_LIMITED' : 'RESET_LINK_INVALID',
    );
  }

  await clearAuthRateLimit(rateKey);
  return { ok: true };
}

export async function logout(request: ApiRequest, response: ApiResponse): Promise<OkResponse> {
  const raw = parseCookies(request)[SESSION_COOKIE];
  if (raw) await deleteSessionByHash(hashSessionToken(raw));
  setSessionCookie(response, '', 0);
  return { ok: true };
}
