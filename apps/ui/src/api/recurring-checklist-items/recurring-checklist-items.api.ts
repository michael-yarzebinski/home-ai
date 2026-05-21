import type {
  InsertableRecurringChecklistItem,
  RecurringChecklistItem,
  UpdatableRecurringChecklistItem,
} from '@home-ai/shared/domain/checklist/recurring-checklist-item';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/recurring-checklist-items';

export const recurringChecklistItemsApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<RecurringChecklistItem>>(`${BASE}/search`, dto),

  create: (body: InsertableRecurringChecklistItem) =>
    apiClient.post<RecurringChecklistItem>(BASE, body),

  getById: (id: string) =>
    apiClient.get<RecurringChecklistItem>(`${BASE}/${encodeURIComponent(id)}`),

  update: (id: string, body: UpdatableRecurringChecklistItem) =>
    apiClient.put<RecurringChecklistItem>(
      `${BASE}/${encodeURIComponent(id)}`,
      body,
    ),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
