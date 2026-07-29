import { z } from 'zod';
import { RoleSchema } from '../role/role';

export const ChecklistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  readRoles: z.array(RoleSchema),
  writeRoles: z.array(RoleSchema),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Checklist = z.infer<typeof ChecklistSchema>;

export const InsertableChecklistSchema = ChecklistSchema.omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});
export const UpdatableChecklistSchema = InsertableChecklistSchema.partial();

export type InsertableChecklist = z.infer<typeof InsertableChecklistSchema>;
export type UpdatableChecklist = z.infer<typeof UpdatableChecklistSchema>;
