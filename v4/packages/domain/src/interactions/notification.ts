export type CommentNotificationKind = 'comment' | 'reply';

export type CommentNotificationContext = {
  actorId: string;
  contentAuthorId: string;
  parentAuthorId?: string | null;
};

export type CommentNotificationDecision = {
  kind: CommentNotificationKind;
  targetUserId: string;
} | null;

/**
 * Decide who should receive a notification after a comment is created.
 *
 * Domain rules:
 * - a reply targets the parent comment author;
 * - a top-level comment targets the content author;
 * - actors never notify themselves.
 */
export function decideCommentNotification(
  context: CommentNotificationContext,
): CommentNotificationDecision {
  const parentAuthorId = context.parentAuthorId?.trim() || null;
  const targetUserId = parentAuthorId || context.contentAuthorId.trim();

  if (!targetUserId || targetUserId === context.actorId) return null;

  return {
    kind: parentAuthorId ? 'reply' : 'comment',
    targetUserId,
  };
}
