/**
 * Domain model for TaskRequest entity (business logic shape).
 * Uses camelCase for consistency with TypeScript, other domain models,
 * and the AI orchestrator / ToolRouter.
 *
 * ONLY includes fields that exist in the migration (initial_schema.ts)
 * and are actively used in TaskRequestsService, ToolRouter, NotificationTool,
 * AuditTool, and the device/event flows. No invented fields.
 */
export interface TaskRequest {
    id: number;
    taskName: string;
    requesterUserId?: string | null;
    executorUserId?: string | null;
    parameters: Record<string, any>;
    rawMessage?: string | null;
    attachments?: any;
    status: string;
  
    // Device fields
    sourceType: string;
    deviceIdSlug?: string | null;
    eventType?: string | null;
    deviceMetadata?: Record<string, any> | null;
  
    // Approval & quiet hours
    requiresApproval: boolean;
    approvedByUserId?: string | null;
    approvedAt?: Date | null;
    quietHoursQueued: boolean;
    scheduledFor?: Date | null;
  
    createdAt: Date;
    executedAt?: Date | null;
    updatedAt?: Date | null;
    notes?: string | null;
  }
  
  /**
   * Partial for updates (all fields optional).
   */
  export type TaskRequestUpdate = Partial<TaskRequest>;