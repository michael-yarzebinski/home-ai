import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Fact } from '@home-ai/shared/domain/fact/fact';
import { Role } from '@home-ai/shared/domain/role/role';
import { RoleBadgeGroup } from '@/components/role-badge-group/role-badge-group';

export const factColumns: ColumnDef<Fact>[] = [
  {
    accessorKey: 'key',
    header: 'Key',
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-foreground">
        {row.original.key}
      </span>
    ),
  },
  {
    accessorKey: 'value',
    header: 'Value',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-2 max-w-sm">
        {row.original.value}
      </span>
    ),
  },
  {
    id: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
      const tags = row.original.tags;
      if (!tags || tags.length === 0) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: 'readRoles',
    header: 'Read Access',
    cell: ({ row }) => (
      <RoleBadgeGroup roles={(row.original.readRoles ?? []) as Role[]} />
    ),
  },
  {
    id: 'writeRoles',
    header: 'Write Access',
    cell: ({ row }) => (
      <RoleBadgeGroup roles={(row.original.writeRoles ?? []) as Role[]} />
    ),
  },
];
