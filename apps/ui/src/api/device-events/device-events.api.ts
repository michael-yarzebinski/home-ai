import type { DeviceEvent } from '@home-ai/shared/domain/device/device-event';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/device-events';

function toSearchQuery(criteria: SearchCriteriaBase): string {
  const q = new URLSearchParams();
  q.set('page', String(criteria.page));
  q.set('pageSize', String(criteria.pageSize));
  if (criteria.query?.trim()) q.set('query', criteria.query.trim());
  if (criteria.includeInactive != null) {
    q.set('includeInactive', String(criteria.includeInactive));
  }
  return q.toString();
}

export const deviceEventsApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<DeviceEvent>>(`${BASE}/search`, dto),

  getByDeviceId: (deviceId: string, criteria: SearchCriteriaBase) =>
    apiClient.get<Paginated<DeviceEvent>>(
      `${BASE}/device/${encodeURIComponent(deviceId)}?${toSearchQuery(criteria)}`,
    ),
} as const;
