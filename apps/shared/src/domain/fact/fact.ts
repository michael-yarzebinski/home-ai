import { Insertable, Updatable } from '../helper/crud.helper';
import { RoleSchema } from '../role/role';
import { z } from 'zod';

export const FactSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  tags: z.array(z.string()),
  readRoles: z.array(RoleSchema),
  writeRoles: z.array(RoleSchema),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Fact = z.infer<typeof FactSchema>;
export type InsertableFact = Insertable<Fact>;
export type UpdatableFact = Updatable<Fact>;
