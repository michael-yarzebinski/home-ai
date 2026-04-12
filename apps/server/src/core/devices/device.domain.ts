/**
 * Domain model for Device entity (camelCase).
 * Only fields from devices.service.ts and schema. No invented fields.
 */
export interface Device {
  deviceId?: number;
  deviceIdSlug: string;
  deviceType: string;
  friendlyName: string;
  haEntityId?: string | null;
  haDeviceId?: string | null;
  notificationGuidance: Record<string, any>;
  eventTypes: string[];
  ownerUserId?: string | null;
  visibleToRoles?: string | null;
  enabled: boolean;
  lastSeenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
