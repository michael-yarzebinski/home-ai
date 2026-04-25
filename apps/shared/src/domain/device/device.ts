import { Insertable, Updatable } from '../helper/crud.helper';
import { Role } from '../role/role';

export interface Device {
  id: string;
  slug: string;
  friendlyName: string;
  aliases: string[];
  room?: string;
  category?: string;
  readRoles: Role[];
  writeRoles: Role[];
  extraMetadata: any;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertableDevice = Insertable<Device>;
export type UpdatableDevice = Updatable<Device>;
