import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Device } from '@home-ai/shared/domain/device/device';
import { Role } from '@home-ai/shared/domain/role/role';
import { RoleBadgeGroup } from '@/components/role-badge-group/role-badge-group';
import { Zap } from 'lucide-react';

export const deviceColumns: ColumnDef<Device>[] = [
  {
    accessorKey: 'friendlyName',
    header: 'Device',
    cell: ({ row }) => (
      <span className="font-bold text-foreground tracking-tight">
        {row.original.friendlyName}
      </span>
    ),
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.slug}
      </span>
    ),
  },
  {
    accessorKey: 'room',
    header: 'Room',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.room || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const category = row.original.category;
      if (!category) return <span className="text-sm text-muted-foreground">—</span>;
      return (
        <Badge variant="outline" className="font-normal capitalize">
          {category}
        </Badge>
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
  {
    accessorKey: 'llmModelType',
    header: 'LLM',
    cell: ({ row }) =>
      row.original.llmModelType === 'immediate' ? (
        <Badge
          variant="outline"
          className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-normal"
        >
          <Zap className="size-3" />
          Immediate
        </Badge>
      ) : (
        <span className="text-sm text-muted-foreground">Soon</span>
      ),
  },
];
