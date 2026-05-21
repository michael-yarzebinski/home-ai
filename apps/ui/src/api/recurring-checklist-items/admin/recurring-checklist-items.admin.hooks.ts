import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import { recurringChecklistItemsAdminApi } from '@/api/recurring-checklist-items/admin/recurring-checklist-items.admin.api';
import { adminRecurringChecklistItemKeys } from '@/api/recurring-checklist-items/admin/recurring-checklist-items.admin.keys';
import { recurringChecklistItemKeys } from '@/api/recurring-checklist-items/recurring-checklist-items.keys';
import { checklistKeys } from '@/api/checklists/checklists.keys';

export function useAdminRecurringChecklistItemSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminRecurringChecklistItemKeys.list(criteria),
    queryFn: () => recurringChecklistItemsAdminApi.search(criteria),
  });
}

export function useAdminRecurringChecklistItemById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminRecurringChecklistItemKeys.detail(id ?? ''),
    queryFn: () => recurringChecklistItemsAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminRecurringChecklistItemRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringChecklistItemsAdminApi.restore(id),
    onSuccess: (item, id) => {
      void qc.invalidateQueries({ queryKey: adminRecurringChecklistItemKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminRecurringChecklistItemKeys.lists() });
      void qc.invalidateQueries({ queryKey: recurringChecklistItemKeys.lists() });
      void qc.invalidateQueries({ queryKey: recurringChecklistItemKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: checklistKeys.detail(item.checklistId) });
    },
  });
}
