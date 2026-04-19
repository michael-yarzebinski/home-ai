export interface AIAudit {
  id: string;
  timestamp: Date;
  eventType: string;
  userId?: string | null;
  taskRequestId?: string | null;
  taskName?: string | null;
  model?: string | null;
  modelInput?: string | null;
  modelOutput?: string | null;
  latencyMs?: number | null;
  metadata: Record<string, any>;
  notes?: string | null;
}