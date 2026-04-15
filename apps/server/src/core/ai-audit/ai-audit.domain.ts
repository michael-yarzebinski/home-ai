export interface AIAuditDomain {
    id: string;
    timestamp: Date;
    eventType: string;
    userId?: string;
    taskRequestId?: string;
    taskName?: string;
    modelInput?: string;
    modelOutput?: string;
    latencyMs?: number;
    metadata?: Record<string, any>;
    notes?: string;
  }