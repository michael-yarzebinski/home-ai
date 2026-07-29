import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminAuditKeys = {
  all: ['admin', 'audit'] as const,
  lists: () => [...adminAuditKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminAuditKeys.lists(), criteria] as const,
  details: () => [...adminAuditKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminAuditKeys.details(), id] as const,
} as const;
