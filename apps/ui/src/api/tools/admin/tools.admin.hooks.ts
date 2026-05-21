import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import type { Tool, UpdatableTool } from '@home-ai/shared/domain/tool/tool';
import { toolsAdminApi } from '@/api/tools/admin/tools.admin.api';
import { adminToolKeys } from '@/api/tools/admin/tools.admin.keys';
import { toolKeys } from '@/api/tools/tools.keys';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';

export function useAdminToolSearch<TData = Paginated<Tool>>(criteria: SearchCriteriaBase, options?: Omit<UseQueryOptions<Paginated<Tool>, Error, TData>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    ...options,
    queryKey: adminToolKeys.list(criteria),
    queryFn: () => toolsAdminApi.search(criteria),
  });
}

export function useAdminToolById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminToolKeys.detail(id ?? ''),
    queryFn: () => toolsAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminToolUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableTool }) =>
      toolsAdminApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: adminToolKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminToolKeys.lists() });
      void qc.invalidateQueries({ queryKey: toolKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: toolKeys.list() });
    },
  });
}

export function useAdminSoftDeleteTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toolsAdminApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminToolKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminToolKeys.lists() });
      void qc.invalidateQueries({ queryKey: toolKeys.list() });
    },
  });
}

export function useAdminToolRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toolsAdminApi.restore(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminToolKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminToolKeys.lists() });
      void qc.invalidateQueries({ queryKey: toolKeys.list() });
    },
  });
}
