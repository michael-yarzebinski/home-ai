import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Recipe, UpdatableRecipe } from '@home-ai/shared/domain/recipe/recipe';
import { recipesApi } from '@/api/recipes/recipes.api';
import { recipeKeys } from '@/api/recipes/recipes.keys';
import { adminRecipeKeys } from '@/api/recipes/admin/recipes.admin.keys';
import { useApiInfinite } from '../use-api-infinite';

export const useRecipeInfinite = (criteria: Omit<SearchCriteriaBase, 'page'>) =>
  useApiInfinite<Recipe>(
    recipeKeys.list({ ...criteria, page: 1 }),
    recipesApi.search,
    criteria,
  );

export function useRecipeSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: recipeKeys.list(criteria),
    queryFn: () => recipesApi.search(criteria),
  });
}

export function useRecipeById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: recipeKeys.detail(id ?? ''),
    queryFn: () => recipesApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableRecipe }) =>
      recipesApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: recipeKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: recipeKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminRecipeKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminRecipeKeys.detail(id) });
    },
  });
}

export function useSoftDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recipesApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: recipeKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: recipeKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminRecipeKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminRecipeKeys.detail(id) });
    },
  });
}
