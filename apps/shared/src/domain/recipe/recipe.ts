import { Insertable, Updatable } from '../helper/crud.helper';
import { z } from 'zod';

export const RecipeSchema = z.object({
  id: z.string(),
  readableId: z.number(),
  url: z.string().optional(),
  title: z.string(),
  servings: z.number().optional(),
  prepTimeMinutes: z.number().optional(),
  cookTimeMinutes: z.number().optional(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Recipe = z.infer<typeof RecipeSchema>;
export type InsertableRecipe = Insertable<Recipe>;
export type UpdatableRecipe = Updatable<Recipe>;
