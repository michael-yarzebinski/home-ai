import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import { recipesAdminApi } from '@/api/recipes/admin/recipes.admin.api';
import { adminRecipeKeys } from '@/api/recipes/admin/recipes.admin.keys';
import { recipeKeys } from '@/api/recipes/recipes.keys';

export function useAdminRecipeSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminRecipeKeys.list(criteria),
    queryFn: () => recipesAdminApi.search(criteria),
  });
}

export function useAdminRecipeById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminRecipeKeys.detail(id ?? ''),
    queryFn: () => recipesAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminRecipeRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recipesAdminApi.restore(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminRecipeKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminRecipeKeys.lists() });
      void qc.invalidateQueries({ queryKey: recipeKeys.lists() });
      void qc.invalidateQueries({ queryKey: recipeKeys.detail(id) });
    },
  });
}
