import { z } from 'zod';

export const AppConfigSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.unknown(),
  description: z.string().optional(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const InsertableAppConfigSchema = AppConfigSchema.omit({ id: true, active: true, createdAt: true, updatedAt: true });
export const UpdatableAppConfigSchema = InsertableAppConfigSchema.partial();

export type InsertableAppConfig = z.infer<typeof InsertableAppConfigSchema>;
export type UpdatableAppConfig = z.infer<typeof UpdatableAppConfigSchema>;
