import { Insertable, Updatable } from "../helper/crud.helper";
import { RoleSchema } from "../role/role";
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  role: RoleSchema,
  name: z.string(),
  phoneNumber: z.string().optional(),
  accessCodeHash: z.string(),
  timezone: z.string(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
export type InsertableUser = Insertable<User>;
export type UpdatableUser = Updatable<User>;