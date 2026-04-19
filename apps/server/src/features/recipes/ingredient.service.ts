// src/ingredients/ingredient.service.ts
import { Injectable } from '@nestjs/common';
import { IngredientStore } from './ingredient.store';
import { Ingredient } from './ingredient.domain';

@Injectable()
export class IngredientsService {
  constructor(private readonly ingredientStore: IngredientStore) {}

  reader(): Pick<IngredientStore, 'getById' | 'getAllActive'> {
    return this.ingredientStore;
  }

  async createIngredient(data: {
    recipeId: string;
    name: string;
    originalName?: string;
    quantity?: string;
    unit?: string;
    notes?: string;
  }): Promise<Ingredient> {
    return this.ingredientStore.create({
      recipeId: data.recipeId,
      name: data.name,
      originalName: data.originalName,
      quantity: data.quantity,
      unit: data.unit,
      notes: data.notes,
      active: true,
    });
  }

  async createIngredients(data: {
    recipeId: string;
    name: string;
    originalName?: string;
    quantity?: string;
    unit?: string;
    notes?: string;
  }[]) : Promise<Ingredient[]> {
    const createdIngredients: Ingredient[] = [];
    for (const ingredient of data) {
        const createdIngredient = await this.createIngredient(ingredient);
        createdIngredients.push(createdIngredient);
    }

    return createdIngredients;
  }
}