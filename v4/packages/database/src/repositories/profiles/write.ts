import type { UpdateProfileInput } from '@lorion/contracts';
import { database } from '../../core/client.js';

export async function setBookshelfVisibility(
  userId: string,
  bookshelfPublic: boolean,
): Promise<boolean> {
  const result = await database()
    .from('profiles')
    .update({ bookshelf_public: bookshelfPublic, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('user_id')
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function updateProfileRecord(
  userId: string,
  input: UpdateProfileInput,
  allowPrivacyChange: boolean,
): Promise<boolean> {
  const patch: Record<string, unknown> = {
    display_name: input.displayName,
    bio: input.bio,
    profile_type: input.profileType,
    institution: input.institution,
    course: input.course,
    education_level: input.educationLevel,
    updated_at: new Date().toISOString(),
  };
  if (allowPrivacyChange) patch.is_public = input.isPublic;

  const result = await database()
    .from('profiles')
    .update(patch)
    .eq('user_id', userId)
    .select('user_id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function setProfileMediaPath(
  userId: string,
  kind: 'avatar' | 'cover',
  path: string | null,
): Promise<boolean> {
  const column = kind === 'avatar' ? 'avatar_path' : 'cover_path';
  const result = await database()
    .from('profiles')
    .update({ [column]: path, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('user_id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}
