import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import { pendingActionsAdminApi } from '@/api/pending-actions/admin/pending-actions.admin.api';
import { adminPendingActionKeys } from '@/api/pending-actions/admin/pending-actions.admin.keys';
import { pendingActionKeys } from '@/api/pending-actions/pending-actions.keys';

export function useAdminPendingActionSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminPendingActionKeys.list(criteria),
    queryFn: () => pendingActionsAdminApi.search(criteria),
  });
}

export function useAdminPendingActionById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminPendingActionKeys.detail(id ?? ''),
    queryFn: () => pendingActionsAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminSoftDeletePendingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pendingActionsAdminApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminPendingActionKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminPendingActionKeys.lists() });
      void qc.invalidateQueries({ queryKey: pendingActionKeys.list() });
    },
  });
}

export function useAdminPendingActionRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pendingActionsAdminApi.restore(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminPendingActionKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminPendingActionKeys.lists() });
      void qc.invalidateQueries({ queryKey: pendingActionKeys.list() });
    },
  });
}

export function useAdminApprovePendingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pendingActionsAdminApi.approve(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminPendingActionKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminPendingActionKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: pendingActionKeys.list() });
    },
  });
}

export function useAdminRejectPendingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      pendingActionsAdminApi.reject(id, { reason }),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: adminPendingActionKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminPendingActionKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: pendingActionKeys.list() });
    },
  });
}
