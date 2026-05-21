import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminChecklistKeys = {
  all: ['admin', 'checklists'] as const,
  lists: () => [...adminChecklistKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminChecklistKeys.lists(), criteria] as const,
  details: () => [...adminChecklistKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminChecklistKeys.details(), id] as const,
} as const;
