import type {
  AssignChecklistItemBody,
  ChecklistItem,
  InsertableChecklistItem,
  UpdatableChecklistItem,
} from '@home-ai/shared/domain/checklist/checklist-item';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/checklist-items';

export const checklistItemsApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<ChecklistItem>>(`${BASE}/search`, dto),

  create: (body: InsertableChecklistItem) =>
    apiClient.post<ChecklistItem>(BASE, body),

  update: (id: string, body: UpdatableChecklistItem) =>
    apiClient.put<ChecklistItem>(`${BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${BASE}/${encodeURIComponent(id)}`),

  check: (id: string) =>
    apiClient.post<ChecklistItem>(`${BASE}/${encodeURIComponent(id)}/check`),

  uncheck: (id: string) =>
    apiClient.post<ChecklistItem>(`${BASE}/${encodeURIComponent(id)}/uncheck`),

  assign: (id: string, body: AssignChecklistItemBody) =>
    apiClient.post<ChecklistItem>(
      `${BASE}/${encodeURIComponent(id)}/assign`,
      body,
    ),

  unassign: (id: string) =>
    apiClient.post<ChecklistItem>(`${BASE}/${encodeURIComponent(id)}/unassign`),
} as const;
