import { Insertable, Updatable } from '../helper/crud.helper';
import { z } from 'zod';

export const NotificationPreferenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  triggerType: z.string(),
  triggerConfig: z.unknown(),
  messageTemplate: z.string(),
  importance: z.string(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;
export type InsertableNotificationPreference = Insertable<NotificationPreference>;
export type UpdatableNotificationPreference = Updatable<NotificationPreference>;
