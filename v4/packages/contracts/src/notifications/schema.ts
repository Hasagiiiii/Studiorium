import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

export const notificationSchema = z.object({
  id: z.string(),
  type: z.string().default('system'),
  title: z.string(),
  message: optionalText,
  link: optionalText,
  readAt: timestamp,
  createdAt: timestamp,
});

export const notificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema).default([]),
  unreadCount: z.number().int().nonnegative().default(0),
});

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>;
