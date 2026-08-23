import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@lorion/database';
import {
  notificationsResponseSchema,
  okResponseSchema,
  type NotificationsResponse,
  type OkResponse,
} from '@lorion/contracts';
import type { ApiRequest } from '../../core/http/types.js';
import { requireSessionUser } from '../../auth/session.js';

export async function notifications(request: ApiRequest): Promise<NotificationsResponse> {
  const user = await requireSessionUser(request);
  return notificationsResponseSchema.parse(await listNotifications(user.id));
}

export async function readNotification(
  request: ApiRequest,
  notificationId: string,
): Promise<OkResponse> {
  const user = await requireSessionUser(request);
  await markNotificationRead(user.id, notificationId);
  return okResponseSchema.parse({ ok: true });
}

export async function readAllNotifications(request: ApiRequest): Promise<OkResponse> {
  const user = await requireSessionUser(request);
  await markAllNotificationsRead(user.id);
  return okResponseSchema.parse({ ok: true });
}
