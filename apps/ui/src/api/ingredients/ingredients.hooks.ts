import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import { ingredientsApi } from '@/api/ingredients/ingredients.api';
import { ingredientKeys } from '@/api/ingredients/ingredients.keys';
import { adminIngredientKeys } from '@/api/ingredients/admin/ingredients.admin.keys';

export function useIngredientSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: ingredientKeys.list(criteria),
    queryFn: () => ingredientsApi.search(criteria),
  });
}

export function useSoftDeleteIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ingredientsApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: ingredientKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: ingredientKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminIngredientKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminIngredientKeys.detail(id) });
    },
  });
}
