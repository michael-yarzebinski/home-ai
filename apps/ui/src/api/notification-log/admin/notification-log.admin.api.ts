import type { NotificationLog } from '@home-ai/shared/domain/monitoring/notification-log/notification-log';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const ADMIN_BASE = '/v1/admin/notification-log';

export const notificationLogAdminApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<NotificationLog>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<NotificationLog>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),
} as const;
