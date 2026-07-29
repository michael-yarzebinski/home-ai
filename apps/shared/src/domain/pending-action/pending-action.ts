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

// readableId is auto-assigned by the database.
export const InsertablePendingActionSchema = PendingActionSchema.omit({ id: true, active: true, createdAt: true, updatedAt: true, readableId: true });
export const UpdatablePendingActionSchema = InsertablePendingActionSchema.partial();

export type InsertablePendingAction = z.infer<typeof InsertablePendingActionSchema>;
export type UpdatablePendingAction = z.infer<typeof UpdatablePendingActionSchema>;
