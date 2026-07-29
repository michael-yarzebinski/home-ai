import { useEffect, useMemo } from 'react';
import type { Recipe } from '@home-ai/shared/domain/recipe/recipe';
import { useRecipeInfinite } from '@/api/recipes/recipes.hooks';

export function useRecipeHomeData() {
  const {
    data: recipePages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useRecipeInfinite({ query: '', pageSize: 100 });

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const recipes = useMemo<Recipe[]>(
    () =>
      [...(recipePages?.pages.flatMap((p) => p.items) ?? [])].sort((a, b) =>
        a.title.localeCompare(b.title),
      ),
    [recipePages],
  );

  return { recipes, isLoading };
}
