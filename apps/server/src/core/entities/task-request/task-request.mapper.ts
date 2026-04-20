import { TaskRequestDto } from '@home-ai/shared';
import { TaskRequest } from './task-request.domain';

function toIso(d: Date | null | undefined): string | null {
  if (d == null) {
    return null;
  }
  return d instanceof Date ? d.toISOString() : new Date(d as unknown as string).toISOString();
}

export function toTaskRequestDto(r: TaskRequest): TaskRequestDto {
  const dto = new TaskRequestDto();
  dto.id = r.id;
  dto.readableId = r.readableId;
  dto.taskName = r.taskName;
  dto.requesterUserId = r.requesterUserId ?? null;
  dto.executorUserId = r.executorUserId ?? null;
  dto.parameters =
    r.parameters != null && typeof r.parameters === 'object'
      ? { ...(r.parameters as Record<string, unknown>) }
      : (r.parameters as Record<string, unknown> | null | undefined);
  dto.attachments = Array.isArray(r.attachments) ? [...r.attachments] : r.attachments ?? null;
  dto.status = r.status;
  dto.deviceId = r.deviceId ?? null;
  dto.requiresApproval = r.requiresApproval;
  dto.approvedByUserId = r.approvedByUserId ?? null;
  dto.approvedAt = toIso(r.approvedAt ?? undefined);
  dto.quietHoursQueued = r.quietHoursQueued;
  dto.scheduledFor = toIso(r.scheduledFor ?? undefined);
  dto.executedAt = toIso(r.executedAt ?? undefined);
  dto.notes = r.notes ?? null;
  dto.createdAt = toIso(r.createdAt)!;
  dto.updatedAt = toIso(r.updatedAt)!;
  return dto;
}
