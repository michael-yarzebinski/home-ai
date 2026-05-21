import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const recurringChecklistItemKeys = {
  all: ['recurring-checklist-items'] as const,
  lists: () => [...recurringChecklistItemKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) =>
    [...recurringChecklistItemKeys.lists(), criteria] as const,
  details: () => [...recurringChecklistItemKeys.all, 'detail'] as const,
  detail: (id: string) => [...recurringChecklistItemKeys.details(), id] as const,
} as const;
