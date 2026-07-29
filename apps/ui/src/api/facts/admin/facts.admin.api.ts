import type { Fact } from '@home-ai/shared/domain/fact/fact';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';
import { factsApi } from '@/api/facts/facts.api';

const ADMIN_BASE = '/v1/admin/facts';

export const factsAdminApi = {
  ...factsApi,
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Fact>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<Fact>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  restore: (id: string) =>
    apiClient.post<Fact>(`${ADMIN_BASE}/${encodeURIComponent(id)}/restore`),
} as const;
