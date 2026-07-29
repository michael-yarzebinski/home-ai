import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminLogKeys = {
  all: ['admin', 'logs'] as const,
  lists: () => [...adminLogKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminLogKeys.lists(), criteria] as const,
  details: () => [...adminLogKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminLogKeys.details(), id] as const,
} as const;
