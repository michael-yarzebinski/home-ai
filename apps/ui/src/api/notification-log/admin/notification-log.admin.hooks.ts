import { useQuery } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import { notificationLogAdminApi } from '@/api/notification-log/admin/notification-log.admin.api';
import { adminNotificationLogKeys } from '@/api/notification-log/admin/notification-log.admin.keys';

export function useAdminNotificationLogSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminNotificationLogKeys.list(criteria),
    queryFn: () => notificationLogAdminApi.search(criteria),
  });
}

export function useAdminNotificationLogById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminNotificationLogKeys.detail(id ?? ''),
    queryFn: () => notificationLogAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}
