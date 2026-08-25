import {
  assertAuthRateLimitAllowed,
  contentInteractionCounts,
  createContentComment,
  deleteOwnContentComment,
  findAccessibleContentItem,
  findContentCommentById,
  findSocialPostById,
  loadContentInteractions,
  recordAuthRateLimitAttempt,
  setContentLike,
  updateOwnContentComment,
} from '@lorion/database';
import {
  commentDeleteSchema,
  commentMutationSchema,
  createCommentInputSchema,
  likeMutationSchema,
  postDetailSchema,
  updateCommentInputSchema,
  type CommentDelete,
  type CommentMutation,
  type LikeMutation,
  type PostDetail,
} from '@lorion/contracts';
import { decideCommentNotification } from '@lorion/domain';
import { publicSessionUser, requireSessionUser, sessionUser } from '../../auth/session.js';
import { readJson } from '../../core/http/body.js';
import { badRequest, HttpError, notFound } from '../../core/http/errors.js';
import type { ApiRequest } from '../../core/http/types.js';
import { entityId } from '../../core/security/token.js';
import { notifyContentInteraction } from '../notifications/service.js';

const COMMENT_POLICY = {
  scope: 'content_comment',
  maxAttempts: 25,
  windowMs: 60 * 1000,
  blockMs: 5 * 60 * 1000,
};

function contentId(value: string): string {
  try {
    return decodeURIComponent(value || '').trim();
  } catch {
    return '';
  }
}

export async function postDetail(request: ApiRequest, rawContentId: string): Promise<PostDetail> {
  const id = contentId(rawContentId);
  if (!id) throw notFound('Publicação não encontrada.');
  const viewer = await sessionUser(request);
  const [post, interactions] = await Promise.all([
    findSocialPostById(id, viewer?.id),
    loadContentInteractions(id, viewer?.id),
  ]);
  if (!post || !interactions) throw notFound('Publicação não encontrada.');
  return postDetailSchema.parse({ post, interactions });
}

export async function setLike(
  request: ApiRequest,
  rawContentId: string,
  liked: boolean,
): Promise<LikeMutation> {
  const user = await requireSessionUser(request);
  const id = contentId(rawContentId);
  if (!id) throw notFound('Conteúdo não encontrado.');
  const access = await findAccessibleContentItem(id, user.id);
  if (!access) throw notFound('Conteúdo não encontrado.');

  const mutation = await setContentLike(id, user.id, liked);
  const counts = await contentInteractionCounts(id, user.id);

  if (liked && mutation.changed && access.authorId !== user.id) {
    const actor = await publicSessionUser(request);
    await notifyContentInteraction({
      actorId: user.id,
      actorDisplayName: actor?.displayName,
      targetUserId: access.authorId,
      kind: 'like',
      contentType: access.type,
      contentId: id,
    });
  }

  return likeMutationSchema.parse({ liked: mutation.liked, likeCount: counts.likeCount });
}

export async function createComment(
  request: ApiRequest,
  rawContentId: string,
): Promise<CommentMutation> {
  const user = await requireSessionUser(request);
  const id = contentId(rawContentId);
  if (!id) throw notFound('Conteúdo não encontrado.');
  const access = await findAccessibleContentItem(id, user.id);
  if (!access) throw notFound('Conteúdo não encontrado.');

  const parsed = createCommentInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('O comentário precisa ter entre 1 e 2000 caracteres.');

  const rateKey = `content-comment:${user.id}`;
  await assertAuthRateLimitAllowed(rateKey);
  if (await recordAuthRateLimitAttempt(rateKey, COMMENT_POLICY)) {
    throw new HttpError(
      429,
      'Muitos comentários em pouco tempo. Tente novamente mais tarde.',
      'RATE_LIMITED',
    );
  }

  const parent = parsed.data.parentId
    ? await findContentCommentById(parsed.data.parentId, user.id)
    : null;
  const commentId = entityId('cmt');
  await createContentComment({
    id: commentId,
    contentId: id,
    authorId: user.id,
    parentId: parsed.data.parentId,
    body: parsed.data.body,
  });

  const [comment, counts] = await Promise.all([
    findContentCommentById(commentId, user.id),
    contentInteractionCounts(id, user.id),
  ]);
  if (!comment) throw new Error('Comentário criado, mas não encontrado após persistência.');

  const notification = decideCommentNotification({
    actorId: user.id,
    contentAuthorId: access.authorId,
    parentAuthorId: parent?.authorId,
  });
  if (notification) {
    const actor = await publicSessionUser(request);
    await notifyContentInteraction({
      actorId: user.id,
      actorDisplayName: actor?.displayName,
      targetUserId: notification.targetUserId,
      kind: notification.kind,
      contentType: access.type,
      contentId: id,
    });
  }

  return commentMutationSchema.parse({ comment, commentCount: counts.commentCount });
}

export async function updateComment(
  request: ApiRequest,
  rawContentId: string,
  rawCommentId: string,
): Promise<CommentMutation> {
  const user = await requireSessionUser(request);
  const id = contentId(rawContentId);
  const commentId = contentId(rawCommentId);
  const access = id ? await findAccessibleContentItem(id, user.id) : null;
  if (!access || !commentId) throw notFound('Comentário não encontrado.');

  const parsed = updateCommentInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('O comentário precisa ter entre 1 e 2000 caracteres.');
  if (!(await updateOwnContentComment(id, commentId, user.id, parsed.data.body))) {
    throw notFound('Comentário não encontrado ou você não pode editá-lo.');
  }

  const [comment, counts] = await Promise.all([
    findContentCommentById(commentId, user.id),
    contentInteractionCounts(id, user.id),
  ]);
  if (!comment || comment.contentId !== id) throw notFound('Comentário não encontrado.');
  return commentMutationSchema.parse({ comment, commentCount: counts.commentCount });
}

export async function deleteComment(
  request: ApiRequest,
  rawContentId: string,
  rawCommentId: string,
): Promise<CommentDelete> {
  const user = await requireSessionUser(request);
  const id = contentId(rawContentId);
  const commentId = contentId(rawCommentId);
  const access = id ? await findAccessibleContentItem(id, user.id) : null;
  if (!access || !commentId) throw notFound('Comentário não encontrado.');

  const current = await findContentCommentById(commentId, user.id);
  if (!current || current.contentId !== id || current.authorId !== user.id) {
    throw notFound('Comentário não encontrado ou você não pode excluí-lo.');
  }
  if (!(await deleteOwnContentComment(id, commentId, user.id))) {
    throw notFound('Comentário não encontrado ou você não pode excluí-lo.');
  }

  const counts = await contentInteractionCounts(id, user.id);
  return commentDeleteSchema.parse({
    deleted: true,
    commentId,
    commentCount: counts.commentCount,
  });
}
