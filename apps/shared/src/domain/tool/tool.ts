import { RoleSchema } from '../role/role';
import { z } from 'zod';

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  friendlyName: z.string(),
  hints: z.string().optional(),
  requestRoles: z.array(RoleSchema),
  writeRoles: z.array(RoleSchema),
  notifyRoles: z.array(RoleSchema),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Tool = z.infer<typeof ToolSchema>;

export const InsertableToolSchema = ToolSchema.omit({ id: true, active: true, createdAt: true, updatedAt: true });
export const UpdatableToolSchema = InsertableToolSchema.partial();

export type InsertableTool = z.infer<typeof InsertableToolSchema>;
export type UpdatableTool = z.infer<typeof UpdatableToolSchema>;
