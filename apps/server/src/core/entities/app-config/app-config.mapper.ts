import { AppConfigDto } from '@home-ai/shared';
import { AppConfig } from './app-config.domain';

function toIso(d: Date): string {
  return d instanceof Date ? d.toISOString() : new Date(d as unknown as string).toISOString();
}

export function toAppConfigDto(c: AppConfig): AppConfigDto {
  const dto = new AppConfigDto();
  dto.id = c.id;
  dto.key = c.key;
  dto.value =
    c.value != null && typeof c.value === 'object' && !Array.isArray(c.value)
      ? { ...(c.value as Record<string, unknown>) }
      : (c.value as unknown);
  dto.description = c.description ?? null;
  dto.active = c.active;
  dto.createdAt = toIso(c.createdAt);
  dto.updatedAt = toIso(c.updatedAt);
  return dto;
}
