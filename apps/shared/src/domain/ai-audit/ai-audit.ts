import { Insertable } from '../helper/crud.helper';
import { z } from 'zod';

export const AIAuditSchema = z.object({
  id: z.string(),
  userId: z.string(),
  chatSessionId: z.string().optional(),
  userMessage: z.string(),
  toolCalls: z.unknown().optional(),
  finalResponse: z.string().optional(),
  durationMs: z.number().optional(),
  success: z.boolean(),
  createdAt: z.date(),
});

export type AIAudit = z.infer<typeof AIAuditSchema>;
export type InsertableAIAudit = Insertable<AIAudit>;
