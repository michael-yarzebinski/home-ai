import { Insertable } from '../helper/crud.helper';

export interface Log {
  id: string;
  userId?: string;
  severity: string;
  message: string;
  metadata: any;
  createdAt: Date;
}
export type InsertableLog = Insertable<Log>;
