import type { Device, UpdatableDevice } from '@home-ai/shared/domain/device/device';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/devices';

export const devicesApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Device>>(`${BASE}/search`, dto),

  getById: (id: string) => apiClient.get<Device>(`${BASE}/${encodeURIComponent(id)}`),

  update: (id: string, body: UpdatableDevice) =>
    apiClient.put<Device>(`${BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
