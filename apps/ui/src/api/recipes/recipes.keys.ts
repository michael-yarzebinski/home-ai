import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...recipeKeys.lists(), criteria] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
} as const;
