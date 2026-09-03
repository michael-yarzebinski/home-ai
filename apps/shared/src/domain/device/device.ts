import { RoleSchema } from '../role/role';
import { LLMModelType, LLMModelTypeSchema } from '../llm/llm-model-type';
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
  llmModelType: LLMModelTypeSchema.default(LLMModelType.SOON),
  lastTriggeredService: DeviceLastTriggeredServiceSchema.optional(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Device = z.infer<typeof DeviceSchema>;

export const InsertableDeviceSchema = DeviceSchema.omit({ id: true, active: true, createdAt: true, updatedAt: true });
export const UpdatableDeviceSchema = InsertableDeviceSchema.partial();

export type InsertableDevice = z.infer<typeof InsertableDeviceSchema>;
export type UpdatableDevice = z.infer<typeof UpdatableDeviceSchema>;
