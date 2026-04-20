/** Wire shape for AI audit rows (read-only admin API). */
export class AIAuditDto {
  id!: string;
  timestamp!: string;
  eventType!: string;
  userId?: string | null;
  taskRequestId?: string | null;
  taskName?: string | null;
  model?: string | null;
  modelInput?: string | null;
  modelOutput?: string | null;
  latencyMs?: number | null;
  metadata!: Record<string, unknown>;
  notes?: string | null;
}
