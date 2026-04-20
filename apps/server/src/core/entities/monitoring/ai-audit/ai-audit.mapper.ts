import { AIAuditDto } from '@home-ai/shared';
import { AIAudit } from './ai-audit.domain';

function toIso(d: Date): string {
  return d instanceof Date ? d.toISOString() : new Date(d as unknown as string).toISOString();
}

export function toAIAuditDto(a: AIAudit): AIAuditDto {
  const dto = new AIAuditDto();
  dto.id = a.id;
  dto.timestamp = toIso(a.timestamp);
  dto.eventType = a.eventType;
  dto.userId = a.userId ?? null;
  dto.taskRequestId = a.taskRequestId ?? null;
  dto.taskName = a.taskName ?? null;
  dto.model = a.model ?? null;
  dto.modelInput = a.modelInput ?? null;
  dto.modelOutput = a.modelOutput ?? null;
  dto.latencyMs = a.latencyMs ?? null;
  dto.metadata =
    a.metadata != null && typeof a.metadata === 'object' && !Array.isArray(a.metadata)
      ? { ...(a.metadata as Record<string, unknown>) }
      : {};
  dto.notes = a.notes ?? null;
  return dto;
}
