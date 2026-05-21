import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const checklistKeys = {
  all: ['checklists'] as const,
  lists: () => [...checklistKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...checklistKeys.lists(), criteria] as const,
  details: () => [...checklistKeys.all, 'detail'] as const,
  detail: (id: string) => [...checklistKeys.details(), id] as const,
} as const;
