export interface Device {
  id: string;
  deviceIdSlug: string;
  friendlyName: string;
  haEntityId?: string | null;
  notificationGuidance: NotificationGuidanceRule[];
  visibleToRoles: string[];
  active: boolean;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationGuidanceRule {
  entityPattern?: string;
  enabled: boolean;
  instruction: string;
  rolesToNotify?: string[];
}