import { AuditDto } from '@home-ai/shared';
import { Audit } from './audit.domain';

function toIso(d: Date): string {
  return d instanceof Date ? d.toISOString() : new Date(d as unknown as string).toISOString();
}

export function toAuditDto(a: Audit): AuditDto {
  const dto = new AuditDto();
  dto.id = a.id;
  dto.timestamp = toIso(a.timestamp);
  dto.entityType = a.entityType;
  dto.entityId = a.entityId;
  dto.action = a.action;
  dto.userId = a.userId ?? null;
  dto.changes = a.changes ?? null;
  dto.metadata =
    a.metadata != null && typeof a.metadata === 'object' && !Array.isArray(a.metadata)
      ? { ...(a.metadata as Record<string, unknown>) }
      : {};
  dto.notes = a.notes ?? null;
  return dto;
}
