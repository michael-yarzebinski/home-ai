import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { toolsApi } from '@/api/tools/tools.api';
import { toolKeys } from '@/api/tools/tools.keys';
import type { Tool } from '@home-ai/shared/domain/tool/tool';

export function useToolList(options?: Omit<UseQueryOptions<Tool[], Error, Tool[], readonly unknown[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    ...options,
    queryKey: toolKeys.list(),
    queryFn: () => toolsApi.getAll(),
  });
}

export function useToolById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: toolKeys.detail(id ?? ''),
    queryFn: () => toolsApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}
