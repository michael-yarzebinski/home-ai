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

export const InsertableNotificationQueueSchema = NotificationQueueSchema.omit({ id: true, active: true, createdAt: true, updatedAt: true });
export const UpdatableNotificationQueueSchema = InsertableNotificationQueueSchema.partial();

export type InsertableNotificationQueue = z.infer<typeof InsertableNotificationQueueSchema>;
export type UpdatableNotificationQueue = z.infer<typeof UpdatableNotificationQueueSchema>;
