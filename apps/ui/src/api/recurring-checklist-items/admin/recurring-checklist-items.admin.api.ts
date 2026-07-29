import type { RecurringChecklistItem } from '@home-ai/shared/domain/checklist/recurring-checklist-item';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';
import { recurringChecklistItemsApi } from '@/api/recurring-checklist-items/recurring-checklist-items.api';

const ADMIN_BASE = '/v1/admin/recurring-checklist-items';

export const recurringChecklistItemsAdminApi = {
  ...recurringChecklistItemsApi,
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<RecurringChecklistItem>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<RecurringChecklistItem>(
      `${ADMIN_BASE}/${encodeURIComponent(id)}`,
    ),

  restore: (id: string) =>
    apiClient.post<RecurringChecklistItem>(
      `${ADMIN_BASE}/${encodeURIComponent(id)}/restore`,
    ),
} as const;
