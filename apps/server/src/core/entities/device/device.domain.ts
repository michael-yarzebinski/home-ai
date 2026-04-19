export interface Device {
  id: string;
  deviceIdSlug: string;
  friendlyName: string;
  haEntityId?: string | null;
  notificationGuidance: any;   // jsonb
  visibleToRoles: string[];
  active: boolean;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}