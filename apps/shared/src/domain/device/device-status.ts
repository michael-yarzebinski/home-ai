import { z } from "zod";

export const EntityStatusSchema = z.object({
    entityId: z.string(),
    state: z.string(),
    attributes: z.record(z.string(), z.any()),
    lastChanged: z.string().optional(),
    services: z.record(z.string(), z.any()),
});

export const DeviceStatusSchema = z.object({
    deviceSlug: z.string(),
    entities: z.array(EntityStatusSchema),
    lastUpdated: z.string(),
});

export type EntityStatus = z.infer<typeof EntityStatusSchema>;
export type DeviceStatus = z.infer<typeof DeviceStatusSchema>;