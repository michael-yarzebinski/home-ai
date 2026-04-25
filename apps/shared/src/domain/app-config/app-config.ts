import { Insertable, Updatable } from '../helper/crud.helper';

export interface AppConfig {
  id: string;
  key: string;
  value: any;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertableAppConfig = Insertable<AppConfig>;
export type UpdatableAppConfig = Updatable<AppConfig>;
