import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat } from 'lucide-react';
import { useRecipeInfinite } from '@/api/recipes/recipes.hooks';
import { useDebounce } from '@/hooks/use-debounce';
import { EntityTable } from '@/components/entity-table/entity-table';
import { recipeColumns } from './columns';

export function RecipesAll() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useRecipeInfinite({ query: debouncedSearch, pageSize: 20 });

  const recipes = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  return (
    <div className="flex flex-col h-full bg-background md:p-2 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-accent rounded-xl border border-border/50">
            <ChefHat className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Recipes</h1>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
              Browse and search the recipe library.
            </p>
          </div>
        </div>
        <Link
          to="/recipes/home"
          className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline shrink-0"
        >
          Recipe home
        </Link>
      </div>

      <div className="flex-1 overflow-hidden">
        <EntityTable
          columns={recipeColumns}
          data={recipes}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={!!hasNextPage}
          fetchNextPage={fetchNextPage}
          query={search}
          onQueryChange={setSearch}
          searchPlaceholder="Filter recipes..."
          onRowClick={(item) => navigate(`/recipes/details/${item.id}`)}
        />
      </div>
    </div>
  );
}
