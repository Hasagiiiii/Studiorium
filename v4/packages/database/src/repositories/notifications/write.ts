import { database } from '../../core/client.js';

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
