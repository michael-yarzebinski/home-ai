import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminChecklistItemKeys = {
  all: ['admin', 'checklist-items'] as const,
  lists: () => [...adminChecklistItemKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminChecklistItemKeys.lists(), criteria] as const,
  details: () => [...adminChecklistItemKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminChecklistItemKeys.details(), id] as const,
} as const;
