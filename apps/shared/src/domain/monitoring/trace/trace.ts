import { z } from "zod";
import { LogSchema } from "../log/log";
import { AIAuditSchema } from "../ai-audit/ai-audit";

export const TurnTraceSummarySchema = z.object({
  traceId: z.string(),
  userId: z.string().optional(),
  chatSessionId: z.string().optional(),
  prompt: z.string().optional(),
  startedAt: z.date(),
  endedAt: z.date(),
  logCount: z.number(),
  auditCount: z.number(),
  errorCount: z.number(),
});

export type TurnTraceSummary = z.infer<typeof TurnTraceSummarySchema>;

export const TurnTraceDetailSchema = TurnTraceSummarySchema.extend({
  logs: z.array(LogSchema),
  audits: z.array(AIAuditSchema),
});

export type TurnTraceDetail = z.infer<typeof TurnTraceDetailSchema>;
