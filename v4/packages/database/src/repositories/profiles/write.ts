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
