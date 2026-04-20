// src/recipes/recipe.service.ts
import { Injectable } from '@nestjs/common';
import { RecipeDto, SearchRequestDto, SearchResponseDto, SearchUtils } from '@home-ai/shared';
import { RecipeStore } from './recipe.store';
import { Recipe } from './recipe.domain';
import { toRecipeDto } from './recipe.mapper';

@Injectable()
export class RecipesService {
  constructor(private readonly recipeStore: RecipeStore) {}

  reader(): Pick<RecipeStore, 'getAll' | 'getById' | 'getByReadableId' | 'getByReadableIds'> {
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

  async setRecipeActive(id: string, active: boolean): Promise<Recipe> {
    return this.recipeStore.setActive(id, active);
  }

  async search(
    criteria: SearchRequestDto,
  ): Promise<SearchResponseDto<RecipeDto>> {
    const { skip, take } = SearchUtils.toSkipTake(criteria);
    const result = await this.recipeStore.search(
      criteria.search,
      skip,
      take,
      criteria.includeInactive,
    );
    const recipeDtos = result.data.map((r) => toRecipeDto(r));
    return SearchUtils.toSearchResponseDto(criteria, recipeDtos, result.total);
  }

  async deleteRecipe(id: string): Promise<number> {
    return this.recipeStore.delete(id);
  }
}