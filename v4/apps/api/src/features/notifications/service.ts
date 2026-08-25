import { createNotification } from '@lorion/database';
import { entityId } from '../../core/security/token.js';

type ContentInteractionNotificationKind = 'like' | 'comment' | 'reply';

type ContentInteractionNotificationInput = {
  actorId: string;
  actorDisplayName?: string | null;
  targetUserId: string;
  kind: ContentInteractionNotificationKind;
  contentType: string;
  contentId: string;
};

function contentLink(type: string, id: string): string {
  if (type === 'post') return `/publicacoes/${encodeURIComponent(id)}`;
  return '/';
}

function notificationCopy(kind: ContentInteractionNotificationKind): {
  title: string;
  action: string;
} {
  if (kind === 'like') {
    return { title: 'Nova curtida', action: 'curtiu seu conteúdo' };
  }
  if (kind === 'reply') {
    return { title: 'Nova resposta', action: 'respondeu seu comentário' };
  }
  return { title: 'Novo comentário', action: 'comentou no seu conteúdo' };
}

export async function notifyContentInteraction(
  input: ContentInteractionNotificationInput,
): Promise<void> {
  if (input.targetUserId === input.actorId) return;

  const copy = notificationCopy(input.kind);
  const actorName = input.actorDisplayName?.trim() || 'Alguém';

  try {
    await createNotification({
      id: entityId('ntf'),
      userId: input.targetUserId,
      type: input.kind,
      title: copy.title,
      message: `${actorName} ${copy.action}.`,
      link: contentLink(input.contentType, input.contentId),
    });
  } catch (cause) {
    console.error('[Lorion v4 notification]', cause);
  }
}
