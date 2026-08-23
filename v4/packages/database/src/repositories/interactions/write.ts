import { database } from '../../core/client.js';

export async function setContentLike(
  contentId: string,
  userId: string,
  liked: boolean,
): Promise<{ liked: boolean; changed: boolean }> {
  const existing = await database()
    .from('content_likes')
    .select('content_id')
    .eq('content_id', contentId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);

  if (liked) {
    if (existing.data) return { liked: true, changed: false };
    const inserted = await database().from('content_likes').insert({
      content_id: contentId,
      user_id: userId,
    });
    if (inserted.error) {
      if (inserted.error.code === '23505') return { liked: true, changed: false };
      throw new Error(inserted.error.message);
    }
    return { liked: true, changed: true };
  }

  if (!existing.data) return { liked: false, changed: false };
  const removed = await database()
    .from('content_likes')
    .delete()
    .eq('content_id', contentId)
    .eq('user_id', userId);
  if (removed.error) throw new Error(removed.error.message);
  return { liked: false, changed: true };
}

export async function createContentComment(input: {
  id: string;
  contentId: string;
  authorId: string;
  parentId?: string | null;
  body: string;
}): Promise<void> {
  if (input.parentId) {
    const parent = await database()
      .from('content_comments')
      .select('id')
      .eq('id', input.parentId)
      .eq('content_id', input.contentId)
      .eq('moderation_status', 'clear')
      .is('deleted_at', null)
      .maybeSingle();
    if (parent.error) throw new Error(parent.error.message);
    if (!parent.data) {
      const error = new Error('Comentário original não encontrado.');
      Object.assign(error, { status: 404, code: 'COMMENT_PARENT_NOT_FOUND' });
      throw error;
    }
  }

  const result = await database().from('content_comments').insert({
    id: input.id,
    content_id: input.contentId,
    author_id: input.authorId,
    parent_id: input.parentId || null,
    body: input.body,
    moderation_status: 'clear',
  });
  if (result.error) throw new Error(result.error.message);
}

export async function updateOwnContentComment(
  contentId: string,
  commentId: string,
  authorId: string,
  body: string,
): Promise<boolean> {
  const result = await database()
    .from('content_comments')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('content_id', contentId)
    .eq('author_id', authorId)
    .eq('moderation_status', 'clear')
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function deleteOwnContentComment(
  contentId: string,
  commentId: string,
  authorId: string,
): Promise<boolean> {
  const result = await database()
    .from('content_comments')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('content_id', contentId)
    .eq('author_id', authorId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}
