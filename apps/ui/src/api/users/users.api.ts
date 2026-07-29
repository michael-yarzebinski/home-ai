import type { User, UpdatableUserApi } from '@home-ai/shared/domain/user/user';
import { apiClient } from '@/api/client';
import { SearchCriteriaBase } from '../../../../shared/src/search/search';
import { Paginated } from '../../../../shared/src/search/pagination';

const BASE = '/v1/users';

export const usersApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<User>>(`${BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<User>(`${BASE}/${encodeURIComponent(id)}`),

  update: (id: string, body: UpdatableUserApi) =>
    apiClient.put<User>(`${BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
