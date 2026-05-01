import { Insertable, Updatable } from '../helper/crud.helper';
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
export type InsertableAppConfig = Insertable<AppConfig>;
export type UpdatableAppConfig = Updatable<AppConfig>;
