import { database } from '../../core/client.js';

export type AccountRow = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  status: string;
};

export async function findAccountByEmail(email: string): Promise<AccountRow | null> {
  const result = await database()
    .from('users')
    .select('id,email,password_hash,role,status')
    .eq('email', email)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data as AccountRow | null;
}

export async function usernameExists(username: string): Promise<boolean> {
  const result = await database()
    .from('profiles')
    .select('user_id')
    .eq('username', username)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function createAccount(input: {
  id: string;
  email: string;
  passwordHash: string;
  birthYear: number;
  isMinor: boolean;
  username: string;
  displayName: string;
}): Promise<void> {
  const userResult = await database().from('users').insert({
    id: input.id,
    email: input.email,
    password_hash: input.passwordHash,
    role: 'user',
    status: 'active',
    is_minor: input.isMinor,
    birth_year: input.birthYear,
  });
  if (userResult.error) throw new Error(userResult.error.message);

  const profileResult = await database().from('profiles').insert({
    user_id: input.id,
    username: input.username,
    display_name: input.displayName,
    bio: '',
    profile_type: 'estudante',
    is_public: !input.isMinor,
  });
  if (profileResult.error) {
    await database().from('users').delete().eq('id', input.id);
    throw new Error(profileResult.error.message);
  }
}

export async function createSessionRecord(input: {
  userId: string;
  tokenHash: string;
  expiresAt: string;
}): Promise<void> {
  await database().from('sessions').delete().lt('expires_at', new Date().toISOString());
  const result = await database().from('sessions').insert({
    token_hash: input.tokenHash,
    user_id: input.userId,
    expires_at: input.expiresAt,
  });
  if (result.error) throw new Error(result.error.message);
}

export async function deleteSessionByHash(tokenHash: string): Promise<void> {
  const result = await database().from('sessions').delete().eq('token_hash', tokenHash);
  if (result.error) throw new Error(result.error.message);
}
