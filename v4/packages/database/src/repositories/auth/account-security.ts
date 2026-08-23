import { database } from '../../core/client.js';

export type AccountSecurityRow = {
  id: string;
  password_hash: string;
  status: string;
};

export async function findAccountSecurityById(userId: string): Promise<AccountSecurityRow | null> {
  const result = await database()
    .from('users')
    .select('id,password_hash,status')
    .eq('id', userId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data as AccountSecurityRow | null;
}

export async function completeAuthenticatedPasswordChange(
  userId: string,
  passwordHash: string,
): Promise<boolean> {
  const result = await database().rpc('complete_authenticated_password_change', {
    p_user_id: userId,
    p_password_hash: passwordHash,
  });
  if (result.error) throw new Error(result.error.message);
  return result.data === true;
}
