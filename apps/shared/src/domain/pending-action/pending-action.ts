import { Insertable, Updatable } from "../helper/crud.helper";
import { z } from 'zod';

export const PendingActionSchema = z.object({
  id: z.string(),
  readableId: z.number(),
  toolId: z.string(),
  requesterId: z.string(),
  proposedArgs: z.unknown(),
  status: z.enum(['pending', 'approved', 'rejected']),
  reason: z.string().optional(),
  executedBy: z.string().optional(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PendingAction = z.infer<typeof PendingActionSchema>;
export type InsertablePendingAction = Insertable<PendingAction>;
export type UpdatablePendingAction = Updatable<PendingAction>;
