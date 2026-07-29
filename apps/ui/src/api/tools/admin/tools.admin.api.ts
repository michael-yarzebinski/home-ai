import type { Tool, UpdatableTool } from '@home-ai/shared/domain/tool/tool';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';
import { toolsApi } from '@/api/tools/tools.api';

const ADMIN_BASE = '/v1/admin/tools';

export const toolsAdminApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Tool>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<Tool>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  update: (id: string, body: UpdatableTool) =>
    apiClient.put<Tool>(`${ADMIN_BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  restore: (id: string) =>
    apiClient.post<Tool>(`${ADMIN_BASE}/${encodeURIComponent(id)}/restore`),

  getAll: toolsApi.getAll,
} as const;
