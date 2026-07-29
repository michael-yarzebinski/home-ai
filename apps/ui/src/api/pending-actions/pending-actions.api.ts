import type { PendingAction } from '@home-ai/shared/domain/pending-action/pending-action';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/pending-actions';

export const pendingActionsApi = {
  list: () => apiClient.get<Paginated<PendingAction>>(BASE),

  approve: (id: string) =>
    apiClient.post<PendingAction>(
      `${BASE}/${encodeURIComponent(id)}/approve`,
    ),

  reject: (id: string, body: { reason: string }) =>
    apiClient.post<PendingAction>(
      `${BASE}/${encodeURIComponent(id)}/reject`,
      body,
    ),
} as const;
