import { database } from '../../core/client.js';

export async function deleteOutstandingPasswordResetTokens(userId: string): Promise<void> {
  const result = await database()
    .from('password_reset_tokens')
    .delete()
    .eq('user_id', userId)
    .is('used_at', null);
  if (result.error) throw new Error(result.error.message);
}

export async function deleteExpiredPasswordResetTokens(nowIso: string): Promise<void> {
  const result = await database().from('password_reset_tokens').delete().lt('expires_at', nowIso);
  if (result.error) throw new Error(result.error.message);
}

export async function createPasswordResetToken(input: {
  tokenHash: string;
  userId: string;
  expiresAt: string;
}): Promise<void> {
  const result = await database().from('password_reset_tokens').insert({
    token_hash: input.tokenHash,
    user_id: input.userId,
    expires_at: input.expiresAt,
  });
  if (result.error) throw new Error(result.error.message);
}

export async function deletePasswordResetToken(tokenHash: string): Promise<void> {
  const result = await database().from('password_reset_tokens').delete().eq('token_hash', tokenHash);
  if (result.error) throw new Error(result.error.message);
}

export async function completePasswordReset(
  tokenHash: string,
  passwordHash: string,
): Promise<boolean> {
  const result = await database().rpc('complete_password_reset', {
    p_token_hash: tokenHash,
    p_password_hash: passwordHash,
  });
  if (result.error) throw new Error(result.error.message);
  return result.data === true;
}
