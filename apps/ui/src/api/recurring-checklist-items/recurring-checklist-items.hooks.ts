import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type {
  InsertableRecurringChecklistItem,
  UpdatableRecurringChecklistItem,
} from '@home-ai/shared/domain/checklist/recurring-checklist-item';
import { recurringChecklistItemsApi } from '@/api/recurring-checklist-items/recurring-checklist-items.api';
import { recurringChecklistItemKeys } from '@/api/recurring-checklist-items/recurring-checklist-items.keys';
import { adminRecurringChecklistItemKeys } from '@/api/recurring-checklist-items/admin/recurring-checklist-items.admin.keys';
import { checklistKeys } from '@/api/checklists/checklists.keys';

export function useRecurringChecklistItemSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: recurringChecklistItemKeys.list(criteria),
    queryFn: () => recurringChecklistItemsApi.search(criteria),
  });
}

export function useRecurringChecklistItemById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: recurringChecklistItemKeys.detail(id ?? ''),
    queryFn: () => recurringChecklistItemsApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useCreateRecurringChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InsertableRecurringChecklistItem) =>
      recurringChecklistItemsApi.create(body),
    onSuccess: (item) => {
      void qc.invalidateQueries({ queryKey: recurringChecklistItemKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminRecurringChecklistItemKeys.lists() });
      void qc.invalidateQueries({ queryKey: checklistKeys.detail(item.checklistId) });
    },
  });
}

export function useUpdateRecurringChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableRecurringChecklistItem }) =>
      recurringChecklistItemsApi.update(id, body),
    onSuccess: (item, { id }) => {
      void qc.invalidateQueries({ queryKey: recurringChecklistItemKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: recurringChecklistItemKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminRecurringChecklistItemKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminRecurringChecklistItemKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: checklistKeys.detail(item.checklistId) });
    },
  });
}

export function useSoftDeleteRecurringChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      checklistId,
    }: {
      id: string;
      checklistId: string;
    }) => {
      await recurringChecklistItemsApi.softDelete(id);
      return { id, checklistId };
    },
    onSuccess: ({ id, checklistId }) => {
      void qc.invalidateQueries({ queryKey: recurringChecklistItemKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: recurringChecklistItemKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminRecurringChecklistItemKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminRecurringChecklistItemKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: checklistKeys.detail(checklistId) });
    },
  });
}
