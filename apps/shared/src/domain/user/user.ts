import { Insertable, Updatable } from "../helper/crud.helper";
import { Role } from "../role/role";

export interface User {
    id: string;
    role: Role;
    name: string;
    phoneNumber?: string;
    accessCodeHash: string;
    timezone: string;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  export type InsertableUser = Insertable<User>;
  export type UpdatableUser = Updatable<User>;
  