import { Insertable, Updatable } from '../helper/crud.helper';

export interface Ingredient {
  id: string;
  recipeId: string;
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertableIngredient = Insertable<Ingredient>;
export type UpdatableIngredient = Updatable<Ingredient>;
