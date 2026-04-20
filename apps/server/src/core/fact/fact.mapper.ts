import { FactCreateDto, FactDto, FactUpdateDto } from '@home-ai/shared';
import { Fact } from './fact.domain';

function toIso(d: Date): string {
  return d instanceof Date ? d.toISOString() : new Date(d as unknown as string).toISOString();
}

export function toFactDto(f: Fact): FactDto {
  const dto = new FactDto();
  dto.id = f.id;
  dto.key = f.key;
  dto.value = f.value;
  dto.ownerUserId = f.ownerUserId ?? null;
  dto.visibleToRoles = [...(f.visibleToRoles ?? [])];
  dto.createdAt = toIso(f.createdAt);
  dto.updatedAt = toIso(f.updatedAt);
  return dto;
}

export function fromFactCreateDto(body: FactCreateDto): {
  key: string;
  value: string;
  ownerUserId?: string;
  visibilityRoles?: string[];
} {
  return {
    key: body.key,
    value: body.value,
    ownerUserId: body.ownerUserId,
    visibilityRoles: body.visibilityRoles,
  };
}

export function fromFactUpdateDto(body: FactUpdateDto): Partial<Fact> {
  const out: Partial<Fact> = {};
  if (body.key !== undefined) {
    out.key = body.key;
  }
  if (body.value !== undefined) {
    out.value = body.value;
  }
  if (body.ownerUserId !== undefined) {
    out.ownerUserId = body.ownerUserId;
  }
  if (body.visibleToRoles !== undefined) {
    out.visibleToRoles = body.visibleToRoles;
  }
  return out;
}
