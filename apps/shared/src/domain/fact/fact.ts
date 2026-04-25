import { Insertable, Updatable } from '../helper/crud.helper';
import { Role } from '../role/role';

export interface Fact {
  id: string;
  key: string;
  value: string;
  tags: string[];
  readRoles: Role[];
  writeRoles: Role[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertableFact = Insertable<Fact>;
export type UpdatableFact = Updatable<Fact>;
