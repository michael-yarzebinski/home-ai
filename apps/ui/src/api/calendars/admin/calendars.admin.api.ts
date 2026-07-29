import type { Calendar } from '@home-ai/shared/domain/calendar/calendar';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';
import { calendarsApi } from '@/api/calendars/calendars.api';

const ADMIN_BASE = '/v1/admin/calendars';

export const calendarsAdminApi = {
  ...calendarsApi,
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Calendar>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<Calendar>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  restore: (id: string) =>
    apiClient.post<Calendar>(`${ADMIN_BASE}/${encodeURIComponent(id)}/restore`),
} as const;
