import { Insertable } from '../helper/crud.helper';
import { z } from 'zod';

export const NotificationLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  message: z.string(),
  createdAt: z.date(),
});

export type NotificationLog = z.infer<typeof NotificationLogSchema>;
export type InsertableNotificationLog = Insertable<NotificationLog>;
