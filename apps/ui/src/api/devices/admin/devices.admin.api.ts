import type { Device } from '@home-ai/shared/domain/device/device';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';
import { devicesApi } from '@/api/devices/devices.api';

const ADMIN_BASE = '/v1/admin/devices';

export const devicesAdminApi = {
  ...devicesApi,
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Device>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<Device>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  restore: (id: string) =>
    apiClient.post<Device>(`${ADMIN_BASE}/${encodeURIComponent(id)}/restore`),
} as const;
