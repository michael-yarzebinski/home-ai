import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminFactKeys = {
  all: ['admin', 'facts'] as const,
  lists: () => [...adminFactKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminFactKeys.lists(), criteria] as const,
  details: () => [...adminFactKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminFactKeys.details(), id] as const,
} as const;
