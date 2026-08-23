import {
  notificationSchema,
  notificationsResponseSchema,
  type Notification,
  type NotificationsResponse,
} from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

function mapNotification(row: Record<string, unknown>): Notification {
  return notificationSchema.parse({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link,
    readAt: row.read_at,
    createdAt: row.created_at,
  });
}

export async function listNotifications(userId: string, limit = 100): Promise<NotificationsResponse> {
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

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  const result = await database()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);
  if (result.error) throw new Error(result.error.message);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const result = await database()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  if (result.error) throw new Error(result.error.message);
}
