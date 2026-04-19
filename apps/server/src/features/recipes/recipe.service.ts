// src/recipes/recipe.service.ts
import { Injectable } from '@nestjs/common';
import { RecipeStore } from './recipe.store';
import { Recipe } from './recipe.domain';

@Injectable()
export class RecipesService {
  constructor(private readonly recipeStore: RecipeStore) {}

  reader(): Pick<RecipeStore, 'getAll' | 'getAllActive' | 'getById' | 'getByReadableId' | 'getByReadableIds'> {
    return this.recipeStore;
  }

  async createRecipe(data: {
    title: string;
    sourceUrl: string;
    pdfPath: string;
    rawText?: string;
    metadata?: Record<string, any>;
  }): Promise<Recipe> {
    return this.recipeStore.create({
      title: data.title,
      sourceUrl: data.sourceUrl,
      pdfPath: data.pdfPath,
      rawText: data.rawText,
      metadata: data.metadata ?? {},
      active: true,
    });
  }

  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe> {
    return this.recipeStore.update(id, updates);
  }
}