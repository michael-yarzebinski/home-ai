import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Recipe } from '@home-ai/shared/domain/recipe/recipe';
import { ExternalLink } from 'lucide-react';

function formatMinutes(minutes: number | undefined): string {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export const recipeColumns: ColumnDef<Recipe>[] = [
  {
    accessorKey: 'readableId',
    header: 'ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        #{row.original.readableId}
      </span>
    ),
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <span className="font-semibold text-foreground tracking-tight">
        {row.original.title}
      </span>
    ),
  },
  {
    accessorKey: 'servings',
    header: 'Servings',
    cell: ({ row }) => {
      const servings = row.original.servings;
      if (servings == null) return <span className="text-sm text-muted-foreground">—</span>;
      return (
        <Badge variant="secondary" className="font-normal">
          {servings} serving{servings !== 1 ? 's' : ''}
        </Badge>
      );
    },
  },
  {
    id: 'prepTime',
    header: 'Prep',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatMinutes(row.original.prepTimeMinutes)}
      </span>
    ),
  },
  {
    id: 'cookTime',
    header: 'Cook',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatMinutes(row.original.cookTimeMinutes)}
      </span>
    ),
  },
  {
    id: 'url',
    header: 'Source',
    cell: ({ row }) => {
      const url = row.original.url;
      if (!url) return <span className="text-sm text-muted-foreground">—</span>;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="size-3 shrink-0" />
          Link
        </a>
      );
    },
  },
];
