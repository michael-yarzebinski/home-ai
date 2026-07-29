import { Link } from 'react-router-dom';
import { ChefHat, Clock, ExternalLink, Users } from 'lucide-react';
import type { Recipe } from '@home-ai/shared/domain/recipe/recipe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RecipeHomeCardProps {
  recipe: Recipe;
}

function formatMinutes(minutes: number | undefined): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function RecipeHomeCard({ recipe }: RecipeHomeCardProps) {
  const totalMinutes =
    recipe.prepTimeMinutes != null || recipe.cookTimeMinutes != null
      ? (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0)
      : null;

  return (
    <Link to={`/recipes/details/${recipe.id}`} className="block h-full">
      <Card className="h-full transition-colors hover:border-border hover:bg-accent/20">
        <CardHeader className="pb-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ChefHat className="size-4 text-muted-foreground shrink-0" />
              <CardTitle className="text-base font-semibold tracking-tight leading-snug">
                {recipe.title}
              </CardTitle>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px] font-mono">
              #{recipe.readableId}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex flex-col gap-3">
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {recipe.servings != null && (
              <span className="flex items-center gap-1">
                <Users className="size-3.5 shrink-0" />
                {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
              </span>
            )}
            {totalMinutes != null && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" />
                {formatMinutes(totalMinutes)} total
              </span>
            )}
            {recipe.prepTimeMinutes != null && (
              <span className="text-muted-foreground/70">
                {formatMinutes(recipe.prepTimeMinutes)} prep
              </span>
            )}
            {recipe.cookTimeMinutes != null && (
              <span className="text-muted-foreground/70">
                {formatMinutes(recipe.cookTimeMinutes)} cook
              </span>
            )}
          </div>

          {recipe.url && (
            <a
              href={recipe.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-primary hover:underline truncate"
            >
              <ExternalLink className="size-3 shrink-0" />
              <span className="truncate">{recipe.url}</span>
            </a>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
