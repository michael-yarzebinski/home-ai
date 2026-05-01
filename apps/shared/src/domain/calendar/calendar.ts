import { Insertable, Updatable } from '../helper/crud.helper';
import { RoleSchema } from '../role/role';
import { z } from 'zod';

export const CalendarSchema = z.object({
  id: z.string(),
  name: z.string(),
  friendlyName: z.string(),
  aliases: z.array(z.string()),
  readRoles: z.array(RoleSchema),
  writeRoles: z.array(RoleSchema),
  color: z.string().optional(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Calendar = z.infer<typeof CalendarSchema>;
export type InsertableCalendar = Insertable<Calendar>;
export type UpdatableCalendar = Updatable<Calendar>;
