import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Checklist, UpdatableChecklist } from '@home-ai/shared/domain/checklist/checklist';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { checklistsApi } from '@/api/checklists/checklists.api';
import { checklistKeys } from '@/api/checklists/checklists.keys';
import { adminChecklistKeys } from '@/api/checklists/admin/checklists.admin.keys';
import { useApiInfinite } from '../use-api-infinite';

export function useChecklistSearch<TData = Paginated<Checklist>>(criteria: SearchCriteriaBase, options?: Omit<UseQueryOptions<Paginated<Checklist>, Error, TData>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    ...options,
    queryKey: checklistKeys.list(criteria),
    queryFn: () => checklistsApi.search(criteria),
  });
}

export const useChecklistInfinite = (criteria: Omit<SearchCriteriaBase, 'page'>) => 
  useApiInfinite<Checklist>(checklistKeys.list({ ...criteria, page: 1 }), checklistsApi.search, criteria)

export function useChecklistDetail(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: checklistKeys.detail(id ?? ''),
    queryFn: () => checklistsApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useUpdateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableChecklist }) =>
      checklistsApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: checklistKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: checklistKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminChecklistKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminChecklistKeys.detail(id) });
    },
  });
}

export function useSoftDeleteChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checklistsApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: checklistKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: checklistKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminChecklistKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminChecklistKeys.detail(id) });
    },
  });
}
