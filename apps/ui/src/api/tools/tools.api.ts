import type { Tool } from '@home-ai/shared/domain/tool/tool';
import { apiClient } from '@/api/client';

const BASE = '/v1/tools';

export const toolsApi = {
  getAll: () => apiClient.get<Tool[]>(BASE),

  getById: (id: string) =>
    apiClient.get<Tool>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
