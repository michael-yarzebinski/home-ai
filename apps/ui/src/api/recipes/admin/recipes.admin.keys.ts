import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminRecipeKeys = {
  all: ['admin', 'recipes'] as const,
  lists: () => [...adminRecipeKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminRecipeKeys.lists(), criteria] as const,
  details: () => [...adminRecipeKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminRecipeKeys.details(), id] as const,
} as const;
