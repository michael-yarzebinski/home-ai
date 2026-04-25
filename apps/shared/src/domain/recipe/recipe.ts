import { Insertable, Updatable } from '../helper/crud.helper';

export interface Recipe {
  id: string;
  readableId: number;
  url?: string;
  title: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertableRecipe = Insertable<Recipe>;
export type UpdatableRecipe = Updatable<Recipe>;
