import { Insertable, Updatable } from '../helper/crud.helper';
import { z } from 'zod';

export const IngredientSchema = z.object({
  id: z.string(),
  recipeId: z.string(),
  name: z.string(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Ingredient = z.infer<typeof IngredientSchema>;
export type InsertableIngredient = Insertable<Ingredient>;
export type UpdatableIngredient = Updatable<Ingredient>;
