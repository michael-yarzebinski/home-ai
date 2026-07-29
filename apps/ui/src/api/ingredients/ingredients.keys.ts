import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const ingredientKeys = {
  all: ['ingredients'] as const,
  lists: () => [...ingredientKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...ingredientKeys.lists(), criteria] as const,
  details: () => [...ingredientKeys.all, 'detail'] as const,
  detail: (id: string) => [...ingredientKeys.details(), id] as const,
} as const;
