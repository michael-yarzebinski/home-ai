import type {
  Ingredient,
  InsertableIngredient,
  UpdatableIngredient,
} from '@home-ai/shared/domain/recipe/ingredient';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const ADMIN_BASE = '/v1/admin/ingredients';

export const ingredientsAdminApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Ingredient>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<Ingredient>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  create: (body: InsertableIngredient) =>
    apiClient.post<Ingredient>(ADMIN_BASE, body),

  update: (id: string, body: UpdatableIngredient) =>
    apiClient.put<Ingredient>(`${ADMIN_BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  restore: (id: string) =>
    apiClient.post<Ingredient>(`${ADMIN_BASE}/${encodeURIComponent(id)}/restore`),
} as const;
