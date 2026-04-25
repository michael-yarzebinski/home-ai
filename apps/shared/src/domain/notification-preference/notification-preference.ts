import { Insertable, Updatable } from '../helper/crud.helper';

export interface NotificationPreference {
  id: string;
  userId: string;
  triggerType: string;
  triggerConfig: any;
  messageTemplate: string;
  importance: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertableNotificationPreference = Insertable<NotificationPreference>;
export type UpdatableNotificationPreference = Updatable<NotificationPreference>;
