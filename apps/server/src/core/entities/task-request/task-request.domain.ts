export interface TaskRequest {
  id: string;                    // UUID
  readableId: number;            // Human-friendly: 85, 86...
  taskName: string;
  requesterUserId?: string | null;
  executorUserId?: string | null;
  parameters?: Record<string, any>;
  attachments?: any[];
  status: string;
  deviceId?: string | null;
  requiresApproval: boolean;
  approvedByUserId?: string | null;
  approvedAt?: Date | null;
  quietHoursQueued: boolean;
  scheduledFor?: Date | null;
  executedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}