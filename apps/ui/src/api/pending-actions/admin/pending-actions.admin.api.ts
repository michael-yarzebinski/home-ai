import type { PendingAction } from '@home-ai/shared/domain/pending-action/pending-action';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';
import { pendingActionsApi } from '@/api/pending-actions/pending-actions.api';

const ADMIN_BASE = '/v1/admin/pending-actions';

export const pendingActionsAdminApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<PendingAction>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<PendingAction>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  restore: (id: string) =>
    apiClient.post<PendingAction>(
      `${ADMIN_BASE}/${encodeURIComponent(id)}/restore`,
    ),

  approve: pendingActionsApi.approve,
  reject: pendingActionsApi.reject,
} as const;
