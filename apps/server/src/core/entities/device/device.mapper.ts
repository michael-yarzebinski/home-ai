import {
  DeviceCreateDto,
  DeviceDto,
  DeviceUpdateDto,
} from '@home-ai/shared';
import { Device } from './device.domain';

function toIso(d: Date): string {
  return d instanceof Date ? d.toISOString() : new Date(d as unknown as string).toISOString();
}

function jsonObject(v: unknown): Record<string, unknown> {
  if (v != null && typeof v === 'object' && !Array.isArray(v)) {
    return { ...(v as Record<string, unknown>) };
  }
  return {};
}

export function toDeviceDto(d: Device): DeviceDto {
  const dto = new DeviceDto();
  dto.id = d.id;
  dto.deviceIdSlug = d.deviceIdSlug;
  dto.friendlyName = d.friendlyName;
  dto.haEntityId = d.haEntityId ?? null;
  dto.notificationGuidance = jsonObject(d.notificationGuidance);
  dto.visibleToRoles = Array.isArray(d.visibleToRoles) ? [...d.visibleToRoles] : [];
  dto.active = d.active;
  dto.metadata = jsonObject(d.metadata);
  dto.createdAt = toIso(d.createdAt);
  dto.updatedAt = toIso(d.updatedAt);
  return dto;
}

export function fromDeviceCreateDto(body: DeviceCreateDto): {
  deviceIdSlug: string;
  friendlyName: string;
  haEntityId?: string;
  visibleToRoles?: string[];
  notificationGuidance?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
} {
  return {
    deviceIdSlug: body.deviceIdSlug,
    friendlyName: body.friendlyName,
    haEntityId: body.haEntityId,
    visibleToRoles: body.visibleToRoles,
    notificationGuidance: body.notificationGuidance,
    metadata: body.metadata,
  };
}

export function fromDeviceUpdateDto(body: DeviceUpdateDto): Partial<Device> {
  const out: Partial<Device> = {};
  if (body.deviceIdSlug !== undefined) {
    out.deviceIdSlug = body.deviceIdSlug;
  }
  if (body.friendlyName !== undefined) {
    out.friendlyName = body.friendlyName;
  }
  if (body.haEntityId !== undefined) {
    out.haEntityId = body.haEntityId;
  }
  if (body.visibleToRoles !== undefined) {
    out.visibleToRoles = body.visibleToRoles;
  }
  if (body.notificationGuidance !== undefined) {
    out.notificationGuidance = body.notificationGuidance;
  }
  if (body.metadata !== undefined) {
    out.metadata = body.metadata;
  }
  if (body.active !== undefined) {
    out.active = body.active;
  }
  return out;
}
