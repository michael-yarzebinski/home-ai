import type { AppConfig } from '@home-ai/shared/domain/app-config/app-config';
import { apiClient } from '@/api/client';

const BASE = '/v1/app-config';

export const appConfigApi = {
  getAll: () => apiClient.get<AppConfig[]>(BASE),

  getById: (id: string) =>
    apiClient.get<AppConfig>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
