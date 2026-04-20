import { TaskDto, TaskUpdateDto } from '@home-ai/shared';
import { Task } from './task.domain';

function toIso(d: Date): string {
  return d instanceof Date ? d.toISOString() : new Date(d as unknown as string).toISOString();
}

export function toTaskDto(t: Task): TaskDto {
  const dto = new TaskDto();
  dto.taskName = t.taskName;
  dto.description = t.description;
  dto.requestRoles = [...(t.requestRoles ?? [])];
  dto.executeRoles = [...(t.executeRoles ?? [])];
  dto.notifyRoles = [...(t.notifyRoles ?? [])];
  dto.parameters =
    t.parameters != null && typeof t.parameters === 'object'
      ? { ...(t.parameters as Record<string, unknown>) }
      : (t.parameters as Record<string, unknown> | null | undefined);
  dto.active = t.active;
  dto.version = t.version;
  dto.createdAt = toIso(t.createdAt);
  dto.updatedAt = toIso(t.updatedAt);
  return dto;
}

export function fromTaskUpdateDto(body: TaskUpdateDto): Partial<Task> {
  const out: Partial<Task> = {};
  if (body.description !== undefined) {
    out.description = body.description;
  }
  if (body.requestRoles !== undefined) {
    out.requestRoles = body.requestRoles;
  }
  if (body.executeRoles !== undefined) {
    out.executeRoles = body.executeRoles;
  }
  if (body.notifyRoles !== undefined) {
    out.notifyRoles = body.notifyRoles;
  }
  if (body.parameters !== undefined) {
    out.parameters = body.parameters as unknown;
  }
  if (body.active !== undefined) {
    out.active = body.active;
  }
  if (body.version !== undefined) {
    out.version = body.version;
  }
  return out;
}
