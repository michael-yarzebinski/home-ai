import type { Checklist } from '@home-ai/shared/domain/checklist/checklist';
import { Role } from '@home-ai/shared/domain/role/role';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleBadgeGroup } from '@/components/role-badge-group/role-badge-group';
import { formatDate } from '@/utils/date.utils';

interface ChecklistDetailsSummaryProps {
  checklist: Checklist;
}

export function ChecklistDetailsSummary({ checklist }: ChecklistDetailsSummaryProps) {
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-bold uppercase tracking-widest">Checklist details</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div className="min-w-0 lg:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
              Description
            </p>
            {checklist.description ? (
              <p className="text-sm text-muted-foreground line-clamp-2">{checklist.description}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic">No description.</p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Read access
            </p>
            <RoleBadgeGroup roles={checklist.readRoles as Role[]} />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Write access
            </p>
            <RoleBadgeGroup roles={checklist.writeRoles as Role[]} />
          </div>

          <div className="flex gap-6 text-xs text-muted-foreground sm:col-span-2 lg:col-span-1 lg:flex-col lg:gap-2">
            <div>
              <span className="block text-[10px] uppercase tracking-widest font-semibold opacity-60">Created</span>
              {formatDate(checklist.createdAt, { month: 'short', day: 'numeric', year: 'numeric' }) ?? '—'}
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-widest font-semibold opacity-60">Updated</span>
              {formatDate(checklist.updatedAt, { month: 'short', day: 'numeric', year: 'numeric' }) ?? '—'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
