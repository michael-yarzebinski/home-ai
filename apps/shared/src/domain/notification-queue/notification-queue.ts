import { Insertable, Updatable } from '../helper/crud.helper';

export interface NotificationQueue {
  id: string;
  userId: string;
  message: string;
  importance: string;
  scheduledFor: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertableNotificationQueue = Insertable<NotificationQueue>;
export type UpdatableNotificationQueue = Updatable<NotificationQueue>;
