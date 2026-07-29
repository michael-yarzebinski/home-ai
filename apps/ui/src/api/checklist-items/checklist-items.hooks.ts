import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AssignChecklistItemBody,
  InsertableChecklistItem,
  UpdatableChecklistItem,
} from '@home-ai/shared/domain/checklist/checklist-item';
import { checklistItemsApi } from '@/api/checklist-items/checklist-items.api';
import { checklistItemKeys } from '@/api/checklist-items/checklist-items.keys';
import { checklistKeys } from '@/api/checklists/checklists.keys';
import { adminChecklistItemKeys } from '@/api/checklist-items/admin/checklist-items.admin.keys';

function invalidateChecklistTrees(
  qc: ReturnType<typeof useQueryClient>,
  itemId: string,
  checklistId?: string,
) {
  void qc.invalidateQueries({ queryKey: checklistItemKeys.detail(itemId) });
  void qc.invalidateQueries({ queryKey: adminChecklistItemKeys.lists() });
  void qc.invalidateQueries({ queryKey: adminChecklistItemKeys.detail(itemId) });
  if (checklistId) {
    void qc.invalidateQueries({ queryKey: checklistKeys.detail(checklistId) });
  }
}

export function useCreateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InsertableChecklistItem) => checklistItemsApi.create(body),
    onSuccess: (item) => {
      invalidateChecklistTrees(qc, item.id, item.checklistId);
    },
  });
}

export function useUpdateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableChecklistItem }) =>
      checklistItemsApi.update(id, body),
    onSuccess: (item, { id }) => {
      invalidateChecklistTrees(qc, id, item.checklistId);
    },
  });
}

export function useSoftDeleteChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, checklistId }: { id: string; checklistId: string }) => {
      await checklistItemsApi.softDelete(id);
      return { id, checklistId };
    },
    onSuccess: ({ id, checklistId }) => {
      invalidateChecklistTrees(qc, id, checklistId);
    },
  });
}

export function useCheckChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checklistItemsApi.check(id),
    onSuccess: (item, id) => {
      invalidateChecklistTrees(qc, id, item.checklistId);
    },
  });
}

export function useUncheckChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checklistItemsApi.uncheck(id),
    onSuccess: (item, id) => {
      invalidateChecklistTrees(qc, id, item.checklistId);
    },
  });
}

export function useAssignChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AssignChecklistItemBody }) =>
      checklistItemsApi.assign(id, body),
    onSuccess: (item, { id }) => {
      invalidateChecklistTrees(qc, id, item.checklistId);
    },
  });
}

export function useUnassignChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checklistItemsApi.unassign(id),
    onSuccess: (item, id) => {
      invalidateChecklistTrees(qc, id, item.checklistId);
    },
  });
}
