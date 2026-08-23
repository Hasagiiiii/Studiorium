import { database } from '../../core/client.js';

type RateLimitRow = {
  key: string;
  scope: string;
  attempts: number;
  window_started_at: string;
  blocked_until: string | null;
};

type RateLimitPolicy = {
  scope: string;
  maxAttempts: number;
  windowMs: number;
  blockMs: number;
};

const LOGIN_POLICY: RateLimitPolicy = {
  scope: 'login',
  maxAttempts: 8,
  windowMs: 15 * 60 * 1000,
  blockMs: 15 * 60 * 1000,
};

async function readRateLimit(key: string): Promise<RateLimitRow | null> {
  const result = await database()
    .from('auth_rate_limits')
    .select('key,scope,attempts,window_started_at,blocked_until')
    .eq('key', key)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data as RateLimitRow | null;
}

export async function assertAuthRateLimitAllowed(key: string): Promise<void> {
  const row = await readRateLimit(key);
  if (!row?.blocked_until) return;

  if (new Date(row.blocked_until).getTime() > Date.now()) {
    const error = new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
    Object.assign(error, { status: 429, code: 'RATE_LIMITED' });
    throw error;
  }
}

export async function recordAuthRateLimitAttempt(
  key: string,
  policy: RateLimitPolicy,
): Promise<boolean> {
  const now = Date.now();
  const row = await readRateLimit(key);
  const windowStarted = row ? new Date(row.window_started_at).getTime() : 0;
  const insideWindow = Number.isFinite(windowStarted) && now - windowStarted < policy.windowMs;
  const attempts = insideWindow ? Number(row?.attempts || 0) + 1 : 1;
  const blocked = attempts >= policy.maxAttempts;

  const update = await database()
    .from('auth_rate_limits')
    .upsert({
      key,
      scope: policy.scope,
      attempts,
      window_started_at: new Date(insideWindow ? windowStarted : now).toISOString(),
      blocked_until: blocked ? new Date(now + policy.blockMs).toISOString() : null,
      updated_at: new Date(now).toISOString(),
    });
  if (update.error) throw new Error(update.error.message);
  return blocked;
}

export async function clearAuthRateLimit(key: string): Promise<void> {
  const result = await database().from('auth_rate_limits').delete().eq('key', key);
  if (result.error) throw new Error(result.error.message);
}

export async function assertLoginAllowed(key: string): Promise<void> {
  return assertAuthRateLimitAllowed(key);
}

export async function recordLoginFailure(key: string): Promise<boolean> {
  return recordAuthRateLimitAttempt(key, LOGIN_POLICY);
}

export async function clearLoginFailures(key: string): Promise<void> {
  return clearAuthRateLimit(key);
}
