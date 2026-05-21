import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminNoteKeys = {
  all: ['admin', 'notes'] as const,
  lists: () => [...adminNoteKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminNoteKeys.lists(), criteria] as const,
  details: () => [...adminNoteKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminNoteKeys.details(), id] as const,
} as const;
