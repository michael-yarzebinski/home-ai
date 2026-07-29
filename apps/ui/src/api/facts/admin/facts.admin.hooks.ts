import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import { factsAdminApi } from '@/api/facts/admin/facts.admin.api';
import { adminFactKeys } from '@/api/facts/admin/facts.admin.keys';
import { factKeys } from '@/api/facts/facts.keys';

export function useAdminFactSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminFactKeys.list(criteria),
    queryFn: () => factsAdminApi.search(criteria),
  });
}

export function useAdminFactById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminFactKeys.detail(id ?? ''),
    queryFn: () => factsAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminFactRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => factsAdminApi.restore(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminFactKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminFactKeys.lists() });
      void qc.invalidateQueries({ queryKey: factKeys.lists() });
      void qc.invalidateQueries({ queryKey: factKeys.detail(id) });
    },
  });
}
