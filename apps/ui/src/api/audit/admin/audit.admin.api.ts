import type { Audit } from '@home-ai/shared/domain/monitoring/audit/audit';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const ADMIN_BASE = '/v1/admin/audit';

export const auditAdminApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Audit>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<Audit>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),
} as const;
