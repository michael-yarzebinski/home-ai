import { useQuery } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import { logsAdminApi } from '@/api/logs/admin/logs.admin.api';
import { adminLogKeys } from '@/api/logs/admin/logs.admin.keys';

export function useAdminLogSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminLogKeys.list(criteria),
    queryFn: () => logsAdminApi.search(criteria),
  });
}

export function useAdminLogById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminLogKeys.detail(id ?? ''),
    queryFn: () => logsAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}
