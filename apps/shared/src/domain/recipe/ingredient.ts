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

export const InsertableIngredientSchema = IngredientSchema.omit({ id: true, active: true, createdAt: true, updatedAt: true });
export const UpdatableIngredientSchema = InsertableIngredientSchema.partial();

export type InsertableIngredient = z.infer<typeof InsertableIngredientSchema>;
export type UpdatableIngredient = z.infer<typeof UpdatableIngredientSchema>;
