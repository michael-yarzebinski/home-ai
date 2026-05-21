import type { Ingredient } from '@home-ai/shared/domain/recipe/ingredient';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/ingredients';

export const ingredientsApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Ingredient>>(`${BASE}/search`, dto),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
