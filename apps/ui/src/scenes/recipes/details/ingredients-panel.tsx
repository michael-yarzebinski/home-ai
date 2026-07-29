import { FlaskConical, Loader2 } from 'lucide-react';
import type { Ingredient } from '@home-ai/shared/domain/recipe/ingredient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface IngredientsPanelProps {
  ingredients: Ingredient[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

function formatIngredient(ingredient: Ingredient): string {
  const parts: string[] = [];
  if (ingredient.quantity != null) parts.push(String(ingredient.quantity));
  if (ingredient.unit) parts.push(ingredient.unit);
  parts.push(ingredient.name);
  return parts.join(' ');
}

export function IngredientsPanel({
  ingredients,
  isLoading,
  isError,
  error,
}: IngredientsPanelProps) {
  return (
    <Card className="flex h-full max-h-[min(32rem,70vh)] flex-col lg:max-h-none">
      <CardHeader className="shrink-0 space-y-2 pb-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-4 shrink-0 text-muted-foreground" />
          <CardTitle className="text-sm font-bold uppercase tracking-widest">
            Ingredients
          </CardTitle>
        </div>
        {!isLoading && !isError && (
          <CardDescription className="text-xs">
            {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading ingredients…
          </div>
        ) : isError ? (
          <p className="py-4 text-sm text-destructive">
            {error?.message ?? 'Failed to load ingredients.'}
          </p>
        ) : ingredients.length === 0 ? (
          <p className="py-4 text-xs italic text-muted-foreground">
            No ingredients recorded yet.
          </p>
        ) : (
          <ol className="space-y-1.5 list-none">
            {ingredients.map((ingredient, index) => (
              <li
                key={ingredient.id}
                className="flex items-baseline gap-2.5 rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
              >
                <span className="shrink-0 text-[10px] font-mono text-muted-foreground/60 w-5 text-right">
                  {index + 1}.
                </span>
                <div className="min-w-0">
                  <span className="text-sm text-foreground">
                    {formatIngredient(ingredient)}
                  </span>
                  {ingredient.notes && (
                    <span className="ml-2 text-xs text-muted-foreground italic">
                      ({ingredient.notes})
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
