import type { PublicUser } from '@lorion/contracts';
import { database } from '../../core/client.js';

export type SessionUserRow = {
  id: string;
  email: string;
  role: string;
  status: string;
};

export async function findUserBySessionHash(tokenHash: string): Promise<SessionUserRow | null> {
  const sessionResult = await database()
    .from('sessions')
    .select('user_id,expires_at')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (sessionResult.error || !sessionResult.data) return null;

  const userResult = await database()
    .from('users')
    .select('id,email,role,status')
    .eq('id', sessionResult.data.user_id)
    .maybeSingle();

  if (userResult.error || !userResult.data || userResult.data.status === 'suspended') return null;
  return userResult.data as SessionUserRow;
}

export async function toPublicUser(user: SessionUserRow | null): Promise<PublicUser> {
  if (!user) return null;

  const profileResult = await database()
    .from('profiles')
    .select('username,display_name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileResult.error) throw new Error(profileResult.error.message);
  const profile = profileResult.data;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    username: profile?.username || '',
    displayName: profile?.display_name || profile?.username || user.email.split('@')[0] || 'Membro',
  };
}
