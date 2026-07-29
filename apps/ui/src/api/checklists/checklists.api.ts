import type { Checklist, UpdatableChecklist } from '@home-ai/shared/domain/checklist/checklist';
import type { ChecklistDetails } from '@home-ai/shared/domain/checklist/checklist-details';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/checklists';

export const checklistsApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Checklist>>(`${BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<ChecklistDetails>(`${BASE}/${encodeURIComponent(id)}`),

  update: (id: string, body: UpdatableChecklist) =>
    apiClient.put<Checklist>(`${BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
