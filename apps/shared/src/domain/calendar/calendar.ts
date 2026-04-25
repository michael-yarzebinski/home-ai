import { Insertable, Updatable } from '../helper/crud.helper';
import { Role } from '../role/role';

export interface Calendar {
  id: string;
  name: string;
  friendlyName: string;
  aliases: string[];
  readRoles: Role[];
  writeRoles: Role[];
  color?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertableCalendar = Insertable<Calendar>;
export type UpdatableCalendar = Updatable<Calendar>;
