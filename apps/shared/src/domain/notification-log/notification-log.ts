import { Insertable } from '../helper/crud.helper';

export interface NotificationLog {
  id: string;
  userId: string;
  message: string;
  createdAt: Date;
}
export type InsertableNotificationLog = Insertable<NotificationLog>;
