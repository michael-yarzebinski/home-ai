import type { Calendar, UpdatableCalendar } from '@home-ai/shared/domain/calendar/calendar';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/calendars';

export const calendarsApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Calendar>>(`${BASE}/search`, dto),

  getById: (id: string) => apiClient.get<Calendar>(`${BASE}/${encodeURIComponent(id)}`),

  update: (id: string, body: UpdatableCalendar) =>
    apiClient.put<Calendar>(`${BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
