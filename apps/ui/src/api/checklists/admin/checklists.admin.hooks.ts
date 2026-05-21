import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Checklist, InsertableChecklist, UpdatableChecklist } from '@home-ai/shared/domain/checklist/checklist';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { checklistsAdminApi } from '@/api/checklists/admin/checklists.admin.api';
import { adminChecklistKeys } from '@/api/checklists/admin/checklists.admin.keys';
import { checklistKeys } from '@/api/checklists/checklists.keys';

export function useAdminChecklistSearch<TData = Paginated<Checklist>>(criteria: SearchCriteriaBase, options?: Omit<UseQueryOptions<Paginated<Checklist>, Error, TData>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    ...options,
    queryKey: adminChecklistKeys.list(criteria),
    queryFn: () => checklistsAdminApi.search(criteria),
  });
}

export function useAdminChecklistById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminChecklistKeys.detail(id ?? ''),
    queryFn: () => checklistsAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminChecklistCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InsertableChecklist) => checklistsAdminApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminChecklistKeys.lists() });
      void qc.invalidateQueries({ queryKey: checklistKeys.lists() });
    },
  });
}

export function useAdminChecklistUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableChecklist }) =>
      checklistsAdminApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: adminChecklistKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminChecklistKeys.lists() });
      void qc.invalidateQueries({ queryKey: checklistKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: checklistKeys.lists() });
    },
  });
}

export function useAdminSoftDeleteChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checklistsAdminApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminChecklistKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminChecklistKeys.lists() });
      void qc.invalidateQueries({ queryKey: checklistKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: checklistKeys.lists() });
    },
  });
}

export function useAdminChecklistRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checklistsAdminApi.restore(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminChecklistKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminChecklistKeys.lists() });
      void qc.invalidateQueries({ queryKey: checklistKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: checklistKeys.lists() });
    },
  });
}
