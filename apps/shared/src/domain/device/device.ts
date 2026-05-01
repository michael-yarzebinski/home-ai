import { Insertable, Updatable } from '../helper/crud.helper';
import { RoleSchema } from '../role/role';
import { z } from 'zod';

export const DeviceLastTriggeredServiceSchema = z.object({
  entityId: z.string(),
  service: z.string(),
  triggeredBy: z.string(),
  timestamp: z.date(),
  metadata: z.unknown().optional(),
});

export type DeviceLastTriggeredService = z.infer<
  typeof DeviceLastTriggeredServiceSchema
>;

export const DeviceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  friendlyName: z.string(),
  aliases: z.array(z.string()),
  room: z.string().optional(),
  category: z.string().optional(),
  readRoles: z.array(RoleSchema),
  writeRoles: z.array(RoleSchema),
  extraMetadata: z.unknown(),
  isTimeSensitive: z.boolean(),
  lastTriggeredService: DeviceLastTriggeredServiceSchema.optional(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Device = z.infer<typeof DeviceSchema>;
export type InsertableDevice = Insertable<Device>;
export type UpdatableDevice = Updatable<Device>;
