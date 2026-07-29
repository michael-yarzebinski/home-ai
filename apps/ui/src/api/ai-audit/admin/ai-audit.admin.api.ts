import type { AIAudit } from '@home-ai/shared/domain/monitoring/ai-audit/ai-audit';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const ADMIN_BASE = '/v1/admin/ai-audit';

export const aiAuditAdminApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<AIAudit>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<AIAudit>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),
} as const;
