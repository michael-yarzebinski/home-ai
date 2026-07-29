import { useQuery } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import { auditAdminApi } from '@/api/audit/admin/audit.admin.api';
import { adminAuditKeys } from '@/api/audit/admin/audit.admin.keys';

export function useAdminAuditSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminAuditKeys.list(criteria),
    queryFn: () => auditAdminApi.search(criteria),
  });
}

export function useAdminAuditById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminAuditKeys.detail(id ?? ''),
    queryFn: () => auditAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}
