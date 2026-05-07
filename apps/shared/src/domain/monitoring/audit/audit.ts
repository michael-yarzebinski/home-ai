import { Insertable } from '../../helper/crud.helper';
import { z } from 'zod';

export const AuditSchema = z.object({
  id: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  action: z.string(),
  userId: z.string().optional(),
  changes: z.unknown(),
  notes: z.string().optional(),
  createdAt: z.date(),
});

export type Audit = z.infer<typeof AuditSchema>;
export type InsertableAudit = Insertable<Audit>;
