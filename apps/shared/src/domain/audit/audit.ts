import { Insertable } from '../helper/crud.helper';

export interface Audit {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId?: string;
  changes: any;
  notes?: string;
  createdAt: Date;
}
export type InsertableAudit = Insertable<Audit>;
