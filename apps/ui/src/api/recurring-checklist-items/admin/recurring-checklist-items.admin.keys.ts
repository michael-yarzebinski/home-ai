import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminRecurringChecklistItemKeys = {
  all: ['admin', 'recurring-checklist-items'] as const,
  lists: () => [...adminRecurringChecklistItemKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) =>
    [...adminRecurringChecklistItemKeys.lists(), criteria] as const,
  details: () => [...adminRecurringChecklistItemKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminRecurringChecklistItemKeys.details(), id] as const,
} as const;
