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

// readableId is auto-assigned by the database.
export const InsertableRecipeSchema = RecipeSchema.omit({ id: true, active: true, createdAt: true, updatedAt: true, readableId: true });
export const UpdatableRecipeSchema = InsertableRecipeSchema.partial();

export type InsertableRecipe = z.infer<typeof InsertableRecipeSchema>;
export type UpdatableRecipe = z.infer<typeof UpdatableRecipeSchema>;
