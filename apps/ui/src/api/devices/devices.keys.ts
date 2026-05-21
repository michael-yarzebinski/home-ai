import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...deviceKeys.lists(), criteria] as const,
  details: () => [...deviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceKeys.details(), id] as const,
} as const;
