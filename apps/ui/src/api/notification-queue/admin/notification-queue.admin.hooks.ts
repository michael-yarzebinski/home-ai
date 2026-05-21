import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type {
  InsertableNotificationQueue,
  UpdatableNotificationQueue,
} from '@home-ai/shared/domain/notification-queue/notification-queue';
import { notificationQueueAdminApi } from '@/api/notification-queue/admin/notification-queue.admin.api';
import { adminNotificationQueueKeys } from '@/api/notification-queue/admin/notification-queue.admin.keys';

export function useAdminNotificationQueueSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminNotificationQueueKeys.list(criteria),
    queryFn: () => notificationQueueAdminApi.search(criteria),
  });
}

export function useAdminNotificationQueueById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminNotificationQueueKeys.detail(id ?? ''),
    queryFn: () => notificationQueueAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminNotificationQueueCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InsertableNotificationQueue) =>
      notificationQueueAdminApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminNotificationQueueKeys.lists() });
    },
  });
}

export function useAdminNotificationQueueUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableNotificationQueue }) =>
      notificationQueueAdminApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: adminNotificationQueueKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminNotificationQueueKeys.lists() });
    },
  });
}

export function useAdminSoftDeleteNotificationQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationQueueAdminApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminNotificationQueueKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminNotificationQueueKeys.lists() });
    },
  });
}

export function useAdminNotificationQueueRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationQueueAdminApi.restore(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminNotificationQueueKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminNotificationQueueKeys.lists() });
    },
  });
}
