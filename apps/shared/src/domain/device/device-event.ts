import { z } from 'zod';

export const DeviceEventSchema = z.object({
    id: z.string(),
    deviceId: z.string(),
    entityId: z.string(),
    oldState: z.string().nullable(),
    newState: z.string(),
    metadata: z.unknown(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type DeviceEvent = z.infer<typeof DeviceEventSchema>;
export const InsertableDeviceEventSchema = DeviceEventSchema.omit({ id: true, active: true, createdAt: true, updatedAt: true });

export type InsertableDeviceEvent = z.infer<typeof InsertableDeviceEventSchema>;
