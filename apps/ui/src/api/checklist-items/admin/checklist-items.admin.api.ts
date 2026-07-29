import type { ChecklistItem } from '@home-ai/shared/domain/checklist/checklist-item';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';
import { checklistItemsApi } from '@/api/checklist-items/checklist-items.api';

const ADMIN_BASE = '/v1/admin/checklist-items';

export const checklistItemsAdminApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<ChecklistItem>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<ChecklistItem>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  restore: (id: string) =>
    apiClient.post<ChecklistItem>(`${ADMIN_BASE}/${encodeURIComponent(id)}/restore`),

  create: checklistItemsApi.create,
  update: checklistItemsApi.update,
  softDelete: checklistItemsApi.softDelete,
  check: checklistItemsApi.check,
  uncheck: checklistItemsApi.uncheck,
  assign: checklistItemsApi.assign,
  unassign: checklistItemsApi.unassign,
} as const;
