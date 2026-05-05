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

// Full insertable type — includes accessCodeHash for internal (store-level) use.
export const InsertableUserSchema = UserSchema.omit({ id: true, active: true, createdAt: true, updatedAt: true });
export const UpdatableUserSchema = InsertableUserSchema.partial();

export type InsertableUser = z.infer<typeof InsertableUserSchema>;
export type UpdatableUser = z.infer<typeof UpdatableUserSchema>;

// API-safe variants — accessCodeHash managed via dedicated endpoint.
export const InsertableUserApiSchema = InsertableUserSchema.omit({ accessCodeHash: true });
export const UpdatableUserApiSchema = InsertableUserApiSchema.partial();

export type InsertableUserApi = z.infer<typeof InsertableUserApiSchema>;
export type UpdatableUserApi = z.infer<typeof UpdatableUserApiSchema>;