import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminUserKeys.lists(), criteria] as const,
  details: () => [...adminUserKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminUserKeys.details(), id] as const,
} as const;
