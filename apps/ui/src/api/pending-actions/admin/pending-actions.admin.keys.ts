import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminPendingActionKeys = {
  all: ['admin', 'pending-actions'] as const,
  lists: () => [...adminPendingActionKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) =>
    [...adminPendingActionKeys.lists(), criteria] as const,
  details: () => [...adminPendingActionKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminPendingActionKeys.details(), id] as const,
} as const;
