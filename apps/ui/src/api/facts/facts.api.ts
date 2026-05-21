import type { Fact, InsertableFact, UpdatableFact } from '@home-ai/shared/domain/fact/fact';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/facts';

export const factsApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Fact>>(`${BASE}/search`, dto),

  getById: (id: string) => apiClient.get<Fact>(`${BASE}/${encodeURIComponent(id)}`),

  create: (body: InsertableFact) => apiClient.post<Fact>(BASE, body),

  update: (id: string, body: UpdatableFact) =>
    apiClient.put<Fact>(`${BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
