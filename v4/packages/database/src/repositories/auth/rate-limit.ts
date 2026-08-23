import { database } from '../../core/client.js';

type RateLimitRow = {
  key: string;
  scope: string;
  attempts: number;
  window_started_at: string;
  blocked_until: string | null;
};

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export async function assertLoginAllowed(key: string): Promise<void> {
  const result = await database()
    .from('auth_rate_limits')
    .select('key,scope,attempts,window_started_at,blocked_until')
    .eq('key', key)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  const row = result.data as RateLimitRow | null;
  if (!row?.blocked_until) return;
  if (new Date(row.blocked_until).getTime() > Date.now()) {
    const error = new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
    Object.assign(error, { status: 429, code: 'RATE_LIMITED' });
    throw error;
  }
}

export async function recordLoginFailure(key: string): Promise<boolean> {
  const now = Date.now();
  const result = await database()
    .from('auth_rate_limits')
    .select('key,scope,attempts,window_started_at,blocked_until')
    .eq('key', key)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);

  const row = result.data as RateLimitRow | null;
  const windowStarted = row ? new Date(row.window_started_at).getTime() : 0;
  const insideWindow = Number.isFinite(windowStarted) && now - windowStarted < WINDOW_MS;
  const attempts = insideWindow ? Number(row?.attempts || 0) + 1 : 1;
  const blocked = attempts >= MAX_ATTEMPTS;

  const update = await database().from('auth_rate_limits').upsert({
    key,
    scope: 'login',
    attempts,
    window_started_at: new Date(insideWindow ? windowStarted : now).toISOString(),
    blocked_until: blocked ? new Date(now + BLOCK_MS).toISOString() : null,
    updated_at: new Date(now).toISOString(),
  });
  if (update.error) throw new Error(update.error.message);
  return blocked;
}

export async function clearLoginFailures(key: string): Promise<void> {
  const result = await database().from('auth_rate_limits').delete().eq('key', key);
  if (result.error) throw new Error(result.error.message);
}
