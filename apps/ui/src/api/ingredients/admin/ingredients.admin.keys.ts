import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminIngredientKeys = {
  all: ['admin', 'ingredients'] as const,
  lists: () => [...adminIngredientKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminIngredientKeys.lists(), criteria] as const,
  details: () => [...adminIngredientKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminIngredientKeys.details(), id] as const,
} as const;
