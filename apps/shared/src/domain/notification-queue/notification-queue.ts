import { Insertable, Updatable } from '../helper/crud.helper';
import { z } from 'zod';

export const NotificationQueueSchema = z.object({
  id: z.string(),
  userId: z.string(),
  message: z.string(),
  importance: z.string(),
  scheduledFor: z.date(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type NotificationQueue = z.infer<typeof NotificationQueueSchema>;
export type InsertableNotificationQueue = Insertable<NotificationQueue>;
export type UpdatableNotificationQueue = Updatable<NotificationQueue>;
