import type {
  InsertableNotificationQueue,
  NotificationQueue,
  UpdatableNotificationQueue,
} from '@home-ai/shared/domain/notification-queue/notification-queue';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const ADMIN_BASE = '/v1/admin/notification-queue';

export const notificationQueueAdminApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<NotificationQueue>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<NotificationQueue>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  create: (body: InsertableNotificationQueue) =>
    apiClient.post<NotificationQueue>(ADMIN_BASE, body),

  update: (id: string, body: UpdatableNotificationQueue) =>
    apiClient.put<NotificationQueue>(
      `${ADMIN_BASE}/${encodeURIComponent(id)}`,
      body,
    ),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  restore: (id: string) =>
    apiClient.post<NotificationQueue>(
      `${ADMIN_BASE}/${encodeURIComponent(id)}/restore`,
    ),
} as const;
