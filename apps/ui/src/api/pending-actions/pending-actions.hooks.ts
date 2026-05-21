import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pendingActionsApi } from '@/api/pending-actions/pending-actions.api';
import { pendingActionKeys } from '@/api/pending-actions/pending-actions.keys';
import { adminPendingActionKeys } from '@/api/pending-actions/admin/pending-actions.admin.keys';

export function usePendingActionList() {
  return useQuery({
    queryKey: pendingActionKeys.list(),
    queryFn: () => pendingActionsApi.list(),
  });
}

export function useApprovePendingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pendingActionsApi.approve(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: pendingActionKeys.list() });
      void qc.invalidateQueries({ queryKey: pendingActionKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminPendingActionKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminPendingActionKeys.detail(id) });
    },
  });
}

export function useRejectPendingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      pendingActionsApi.reject(id, { reason }),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: pendingActionKeys.list() });
      void qc.invalidateQueries({ queryKey: pendingActionKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminPendingActionKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminPendingActionKeys.detail(id) });
    },
  });
}
