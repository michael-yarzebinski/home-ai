import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const factKeys = {
  all: ['facts'] as const,
  lists: () => [...factKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...factKeys.lists(), criteria] as const,
  details: () => [...factKeys.all, 'detail'] as const,
  detail: (id: string) => [...factKeys.details(), id] as const,
} as const;
