import { useQuery } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import { aiAuditAdminApi } from '@/api/ai-audit/admin/ai-audit.admin.api';
import { adminAiAuditKeys } from '@/api/ai-audit/admin/ai-audit.admin.keys';

export function useAdminAiAuditSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminAiAuditKeys.list(criteria),
    queryFn: () => aiAuditAdminApi.search(criteria),
  });
}

export function useAdminAiAuditById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminAiAuditKeys.detail(id ?? ''),
    queryFn: () => aiAuditAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}
