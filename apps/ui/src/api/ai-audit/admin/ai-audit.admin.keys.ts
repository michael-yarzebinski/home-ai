import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminAiAuditKeys = {
  all: ['admin', 'ai-audit'] as const,
  lists: () => [...adminAiAuditKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminAiAuditKeys.lists(), criteria] as const,
  details: () => [...adminAiAuditKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminAiAuditKeys.details(), id] as const,
} as const;
