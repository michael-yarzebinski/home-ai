import type { Recipe } from '@home-ai/shared/domain/recipe/recipe';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';
import { recipesApi } from '@/api/recipes/recipes.api';

const ADMIN_BASE = '/v1/admin/recipes';

export const recipesAdminApi = {
  ...recipesApi,
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Recipe>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<Recipe>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  restore: (id: string) =>
    apiClient.post<Recipe>(`${ADMIN_BASE}/${encodeURIComponent(id)}/restore`),
} as const;
