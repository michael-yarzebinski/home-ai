import { Link } from 'react-router-dom';
import { ChefHat, Loader2 } from 'lucide-react';
import { RecipeHomeCard } from './recipe-home-card';
import { useRecipeHomeData } from './use-recipe-home-data';

export function RecipeHome() {
  const { recipes, isLoading } = useRecipeHomeData();

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-accent rounded-xl border border-border/50 shrink-0">
            <ChefHat className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Recipes</h1>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
              Your recipe library · {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
            </p>
          </div>
        </div>

        <Link
          to="/recipes/all"
          className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline shrink-0 pt-1"
        >
          View all recipes
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin mr-2" />
          Loading recipes…
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <ChefHat className="size-8 mb-3 opacity-40" />
          <p className="text-sm font-medium">No recipes yet</p>
          <p className="text-xs mt-1 max-w-xs">
            Ask the AI to save or scrape a recipe and it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <RecipeHomeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
