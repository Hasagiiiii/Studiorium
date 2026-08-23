import {
  notificationsResponseSchema,
  okResponseSchema,
  type NotificationsResponse,
  type OkResponse,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class NotificationsService {
  constructor(private readonly client: ApiClient) {}

  list(): Promise<NotificationsResponse> {
    return this.client.request('/api/v4/notifications', notificationsResponseSchema);
  }

  markRead(notificationId: string): Promise<OkResponse> {
    return this.client.request(
      `/api/v4/notifications/${encodeURIComponent(notificationId)}/read`,
      okResponseSchema,
      { method: 'POST' },
    );
  }

  markAllRead(): Promise<OkResponse> {
    return this.client.request('/api/v4/notifications/read-all', okResponseSchema, {
      method: 'POST',
    });
  }
}
