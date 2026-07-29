import type { Recipe, UpdatableRecipe } from '@home-ai/shared/domain/recipe/recipe';
import type { Ingredient } from '@home-ai/shared/domain/recipe/ingredient';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/recipes';

export const recipesApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Recipe>>(`${BASE}/search`, dto),

  getById: (id: string) => apiClient.get<Recipe>(`${BASE}/${encodeURIComponent(id)}`),

  getIngredients: (id: string) =>
    apiClient.get<Ingredient[]>(`${BASE}/${encodeURIComponent(id)}/ingredients`),

  update: (id: string, body: UpdatableRecipe) =>
    apiClient.put<Recipe>(`${BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
