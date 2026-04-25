import { Insertable, Updatable } from '../helper/crud.helper';
import { Role } from '../role/role';

export interface Note {
  id: string;
  name: string;
  friendlyName: string;
  aliases: string[];
  readRoles: Role[];
  writeRoles: Role[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertableNote = Insertable<Note>;
export type UpdatableNote = Updatable<Note>;
