import { Insertable, Updatable } from '../helper/crud.helper';
import { Role } from '../role/role';

export interface Tool {
  id: string;
  name: string;
  friendlyName: string;
  hints?: string;
  requestRoles: Role[];
  writeRoles: Role[];
  notifyRoles: Role[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertableTool = Insertable<Tool>;
export type UpdatableTool = Updatable<Tool>;
