import type {
  AppConfig,
  InsertableAppConfig,
  UpdatableAppConfig,
} from '@home-ai/shared/domain/app-config/app-config';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';
import { appConfigApi } from '@/api/app-config/app-config.api';

const ADMIN_BASE = '/v1/admin/app-config';

export const appConfigAdminApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<AppConfig>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<AppConfig>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  create: (body: InsertableAppConfig) =>
    apiClient.post<AppConfig>(ADMIN_BASE, body),

  update: (id: string, body: UpdatableAppConfig) =>
    apiClient.put<AppConfig>(`${ADMIN_BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  restore: (id: string) =>
    apiClient.post<AppConfig>(`${ADMIN_BASE}/${encodeURIComponent(id)}/restore`),

  getAll: appConfigApi.getAll,
} as const;
