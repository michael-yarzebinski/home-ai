import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import { checklistItemsAdminApi } from '@/api/checklist-items/admin/checklist-items.admin.api';
import { adminChecklistItemKeys } from '@/api/checklist-items/admin/checklist-items.admin.keys';
import { checklistItemKeys } from '@/api/checklist-items/checklist-items.keys';
import { checklistKeys } from '@/api/checklists/checklists.keys';

export function useAdminChecklistItemSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminChecklistItemKeys.list(criteria),
    queryFn: () => checklistItemsAdminApi.search(criteria),
  });
}

export function useAdminChecklistItemById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminChecklistItemKeys.detail(id ?? ''),
    queryFn: () => checklistItemsAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminChecklistItemRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checklistItemsAdminApi.restore(id),
    onSuccess: (item, id) => {
      void qc.invalidateQueries({ queryKey: adminChecklistItemKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminChecklistItemKeys.lists() });
      void qc.invalidateQueries({ queryKey: checklistItemKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: checklistKeys.detail(item.checklistId) });
    },
  });
}
