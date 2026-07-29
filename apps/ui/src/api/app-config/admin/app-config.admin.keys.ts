import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminAppConfigKeys = {
  all: ['admin', 'app-config'] as const,
  lists: () => [...adminAppConfigKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminAppConfigKeys.lists(), criteria] as const,
  details: () => [...adminAppConfigKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminAppConfigKeys.details(), id] as const,
} as const;
