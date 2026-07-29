import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...noteKeys.lists(), criteria] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
} as const;
