import { LogDto } from '@home-ai/shared';
import { Log } from './log.domain';

function toIso(d: Date): string {
  return d instanceof Date ? d.toISOString() : new Date(d as unknown as string).toISOString();
}

export function toLogDto(l: Log): LogDto {
  const dto = new LogDto();
  dto.id = l.id;
  dto.severity = l.severity ?? null;
  dto.message = l.message ?? null;
  dto.data =
    l.data != null && typeof l.data === 'object' && !Array.isArray(l.data)
      ? { ...(l.data as Record<string, unknown>) }
      : (l.data as Record<string, unknown> | null | undefined) ?? null;
  dto.userId = l.userId ?? null;
  dto.createdAt = toIso(l.createdAt);
  return dto;
}
