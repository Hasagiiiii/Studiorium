import { profileSchema, type Profile } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

function mapProfile(row: Record<string, unknown>): Profile {
  return profileSchema.parse({
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    profileType: row.profile_type,
    institution: row.institution,
    course: row.course,
    educationLevel: row.education_level,
    verificationStatus: row.verification_status,
    verifiedSpecialty: row.verified_specialty,
    contributionStatus: row.contribution_status,
    hasAvatar: Boolean(row.avatar_path),
    hasCover: Boolean(row.cover_path),
    isPublic: row.is_public,
    bookshelfPublic: row.bookshelf_public,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function listPublicProfiles(): Promise<Profile[]> {
  const result = await database()
    .from('profiles')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  return queryList(result).map((row) => mapProfile(row as Record<string, unknown>));
}

export async function findProfileByUserId(userId: string): Promise<Profile | null> {
  const result = await database().from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapProfile(result.data as Record<string, unknown>) : null;
}

export async function findProfileByUsername(username: string): Promise<Profile | null> {
  const result = await database()
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data ? mapProfile(result.data as Record<string, unknown>) : null;
}

export async function findPublicProfile(username: string): Promise<Profile | null> {
  const result = await database()
    .from('profiles')
    .select('*')
    .eq('username', username)
    .eq('is_public', true)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data ? mapProfile(result.data as Record<string, unknown>) : null;
}
