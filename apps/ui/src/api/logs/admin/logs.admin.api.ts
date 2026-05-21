import type { Log } from '@home-ai/shared/domain/monitoring/log/log';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const ADMIN_BASE = '/v1/admin/logs';

export const logsAdminApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Log>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<Log>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),
} as const;
