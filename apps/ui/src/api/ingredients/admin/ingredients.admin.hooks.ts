import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type {
  InsertableIngredient,
  UpdatableIngredient,
} from '@home-ai/shared/domain/recipe/ingredient';
import { ingredientsAdminApi } from '@/api/ingredients/admin/ingredients.admin.api';
import { adminIngredientKeys } from '@/api/ingredients/admin/ingredients.admin.keys';
import { ingredientKeys } from '@/api/ingredients/ingredients.keys';

export function useAdminIngredientSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminIngredientKeys.list(criteria),
    queryFn: () => ingredientsAdminApi.search(criteria),
  });
}

export function useAdminIngredientById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminIngredientKeys.detail(id ?? ''),
    queryFn: () => ingredientsAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminIngredientCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InsertableIngredient) => ingredientsAdminApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminIngredientKeys.lists() });
      void qc.invalidateQueries({ queryKey: ingredientKeys.lists() });
    },
  });
}

export function useAdminIngredientUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableIngredient }) =>
      ingredientsAdminApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: adminIngredientKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminIngredientKeys.lists() });
      void qc.invalidateQueries({ queryKey: ingredientKeys.lists() });
    },
  });
}

export function useAdminSoftDeleteIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ingredientsAdminApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminIngredientKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminIngredientKeys.lists() });
      void qc.invalidateQueries({ queryKey: ingredientKeys.lists() });
    },
  });
}

export function useAdminIngredientRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ingredientsAdminApi.restore(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminIngredientKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminIngredientKeys.lists() });
      void qc.invalidateQueries({ queryKey: ingredientKeys.lists() });
    },
  });
}
