import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { InsertableFact, UpdatableFact } from '@home-ai/shared/domain/fact/fact';
import { factsApi } from '@/api/facts/facts.api';
import { factKeys } from '@/api/facts/facts.keys';
import { adminFactKeys } from '@/api/facts/admin/facts.admin.keys';

export function useFactSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: factKeys.list(criteria),
    queryFn: () => factsApi.search(criteria),
  });
}

export function useFactById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: factKeys.detail(id ?? ''),
    queryFn: () => factsApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useCreateFact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InsertableFact) => factsApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: factKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminFactKeys.lists() });
    },
  });
}

export function useUpdateFact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableFact }) =>
      factsApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: factKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: factKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminFactKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminFactKeys.detail(id) });
    },
  });
}

export function useSoftDeleteFact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => factsApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: factKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: factKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminFactKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminFactKeys.detail(id) });
    },
  });
}
