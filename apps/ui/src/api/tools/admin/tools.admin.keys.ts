import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminToolKeys = {
  all: ['admin', 'tools'] as const,
  lists: () => [...adminToolKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminToolKeys.lists(), criteria] as const,
  details: () => [...adminToolKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminToolKeys.details(), id] as const,
} as const;
