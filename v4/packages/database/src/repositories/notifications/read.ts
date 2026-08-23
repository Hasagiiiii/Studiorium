import {
  notificationSchema,
  notificationsResponseSchema,
  type Notification,
  type NotificationsResponse,
} from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

const ACTIVE_LINKS = [
  /^\/$/,
  /^\/explorar(?:[?#].*)?$/,
  /^\/comunidades(?:\/[^/?#]+)?(?:[?#].*)?$/,
  /^\/discussoes\/[^/?#]+(?:[?#].*)?$/,
  /^\/biblioteca(?:[?#].*)?$/,
  /^\/livros\/[^/?#]+(?:[?#].*)?$/,
  /^\/pesquisas\/[^/?#]+(?:[?#].*)?$/,
  /^\/projetos(?:\/[^/?#]+)?(?:[?#].*)?$/,
  /^\/noticias\/[^/?#]+(?:[?#].*)?$/,
  /^\/perfil\/[^/?#]+(?:[?#].*)?$/,
  /^\/notificacoes(?:[?#].*)?$/,
] as const;

function normalizeNotificationLink(value: unknown): string {
  const link = typeof value === 'string' ? value.trim() : '';
  if (!link.startsWith('/') || link.startsWith('//')) return '';
  return ACTIVE_LINKS.some((pattern) => pattern.test(link)) ? link : '';
}

function mapNotification(row: Record<string, unknown>): Notification {
  return notificationSchema.parse({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: normalizeNotificationLink(row.link),
    readAt: row.read_at,
    createdAt: row.created_at,
  });
}

export async function listNotifications(
  userId: string,
  limit = 100,
): Promise<NotificationsResponse> {
  const result = await database()
    .from('notifications')
    .select('id,type,title,message,link,read_at,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(Math.min(200, Math.max(1, limit)));

  const notifications = queryList(result).map((row) =>
    mapNotification(row as Record<string, unknown>),
  );
  return notificationsResponseSchema.parse({
    notifications,
    unreadCount: notifications.filter((item) => !item.readAt).length,
  });
}
