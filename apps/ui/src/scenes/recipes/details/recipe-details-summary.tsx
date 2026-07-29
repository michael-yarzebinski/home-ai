import type { Recipe } from '@home-ai/shared/domain/recipe/recipe';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/utils/date.utils';
import { Clock, ExternalLink, Users } from 'lucide-react';

interface RecipeDetailsSummaryProps {
  recipe: Recipe;
}

function formatMinutes(minutes: number | undefined): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function RecipeDetailsSummary({ recipe }: RecipeDetailsSummaryProps) {
  const totalMinutes =
    recipe.prepTimeMinutes != null || recipe.cookTimeMinutes != null
      ? (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0)
      : null;

  return (
    <Card>
      <CardHeader className="py-4 px-5">
        <CardTitle className="text-sm font-bold uppercase tracking-widest">
          Recipe details
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-5 pb-5 pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="sm:col-span-2 xl:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
              Recipe ID
            </p>
            <Badge variant="outline" className="font-mono text-xs">
              #{recipe.readableId}
            </Badge>
          </div>

          {recipe.servings != null && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                Servings
              </p>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="size-3.5 shrink-0" />
                {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {totalMinutes != null && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                Total time
              </p>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5 shrink-0" />
                {formatMinutes(totalMinutes)}
              </span>
            </div>
          )}

          {recipe.prepTimeMinutes != null && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                Prep time
              </p>
              <p className="text-sm text-muted-foreground">{formatMinutes(recipe.prepTimeMinutes)}</p>
            </div>
          )}

          {recipe.cookTimeMinutes != null && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                Cook time
              </p>
              <p className="text-sm text-muted-foreground">{formatMinutes(recipe.cookTimeMinutes)}</p>
            </div>
          )}

          {recipe.url && (
            <div className="sm:col-span-2 xl:col-span-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                Source
              </p>
              <a
                href={recipe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
              >
                <ExternalLink className="size-3.5 shrink-0" />
                {recipe.url}
              </a>
            </div>
          )}

          <div className="flex gap-6 text-xs text-muted-foreground sm:col-span-2 xl:col-span-3">
            <div>
              <span className="block text-[10px] uppercase tracking-widest font-semibold opacity-60">
                Created
              </span>
              {formatDate(recipe.createdAt, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              }) ?? '—'}
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-widest font-semibold opacity-60">
                Updated
              </span>
              {formatDate(recipe.updatedAt, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              }) ?? '—'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
