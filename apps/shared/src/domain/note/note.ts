import { Insertable, Updatable } from '../helper/crud.helper';
import { RoleSchema } from '../role/role';
import { z } from 'zod';

export const NoteSchema = z.object({
  id: z.string(),
  name: z.string(),
  friendlyName: z.string(),
  aliases: z.array(z.string()),
  readRoles: z.array(RoleSchema),
  writeRoles: z.array(RoleSchema),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Note = z.infer<typeof NoteSchema>;
export type InsertableNote = Insertable<Note>;
export type UpdatableNote = Updatable<Note>;
