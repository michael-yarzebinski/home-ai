import type { Checklist, InsertableChecklist, UpdatableChecklist } from '@home-ai/shared/domain/checklist/checklist';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const ADMIN_BASE = '/v1/admin/checklists';

export const checklistsAdminApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Checklist>>(`${ADMIN_BASE}/search`, dto),

  create: (body: InsertableChecklist) =>
    apiClient.post<Checklist>(ADMIN_BASE, body),

  getById: (id: string) =>
    apiClient.get<Checklist>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  update: (id: string, body: UpdatableChecklist) =>
    apiClient.put<Checklist>(`${ADMIN_BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  restore: (id: string) =>
    apiClient.post<Checklist>(`${ADMIN_BASE}/${encodeURIComponent(id)}/restore`),
} as const;
