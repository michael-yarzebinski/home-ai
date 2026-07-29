import { z } from "zod";

export const CallServiceSchema = z.object({
    deviceId: z.string(),
    entityId: z.string(),
    service: z.string(),
    data: z.record(z.string(), z.any()),
});

export type CallService = z.infer<typeof CallServiceSchema>;