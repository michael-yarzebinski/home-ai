import type { Recipe, UpdatableRecipe } from '@home-ai/shared/domain/recipe/recipe';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/recipes';

export const recipesApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Recipe>>(`${BASE}/search`, dto),

  getById: (id: string) => apiClient.get<Recipe>(`${BASE}/${encodeURIComponent(id)}`),

  update: (id: string, body: UpdatableRecipe) =>
    apiClient.put<Recipe>(`${BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
