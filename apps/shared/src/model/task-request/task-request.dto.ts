import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Read model for task requests (ISO strings for dates). */
export class TaskRequestDto {
  id!: string;
  readableId!: number;
  taskName!: string;
  requesterUserId?: string | null;
  executorUserId?: string | null;
  parameters?: Record<string, unknown> | null;
  attachments?: unknown[] | null;
  status!: string;
  deviceId?: string | null;
  requiresApproval!: boolean;
  approvedByUserId?: string | null;
  approvedAt?: string | null;
  quietHoursQueued!: boolean;
  scheduledFor?: string | null;
  executedAt?: string | null;
  notes?: string | null;
  createdAt!: string;
  updatedAt!: string;
}

/** PATCH /admin/task-requests/:id/status — no create endpoint. */
export class TaskRequestUpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsOptional()
  @IsString()
  executorUserId?: string;
}
