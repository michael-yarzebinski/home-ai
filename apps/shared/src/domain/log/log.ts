import { Insertable } from '../helper/crud.helper';
import { z } from 'zod';

export const LogSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  severity: z.string(),
  message: z.string(),
  metadata: z.unknown(),
  createdAt: z.date(),
});

export type Log = z.infer<typeof LogSchema>;
export type InsertableLog = Insertable<Log>;
