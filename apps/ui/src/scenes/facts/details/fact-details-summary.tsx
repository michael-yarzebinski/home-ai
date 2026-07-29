import type { Fact } from '@home-ai/shared/domain/fact/fact';
import { Role } from '@home-ai/shared/domain/role/role';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleBadgeGroup } from '@/components/role-badge-group/role-badge-group';
import { formatDate } from '@/utils/date.utils';

interface FactDetailsSummaryProps {
  fact: Fact;
}

export function FactDetailsSummary({ fact }: FactDetailsSummaryProps) {
  return (
    <Card>
      <CardHeader className="py-4 px-5">
        <CardTitle className="text-sm font-bold uppercase tracking-widest">
          Fact details
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-5 pb-5 pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
              Key
            </p>
            <p className="font-mono text-sm text-foreground font-semibold break-all">{fact.key}</p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
              Value
            </p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {fact.value}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Tags
            </p>
            {fact.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {fact.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No tags.</p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Read access
            </p>
            <RoleBadgeGroup roles={fact.readRoles as Role[]} />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Write access
            </p>
            <RoleBadgeGroup roles={fact.writeRoles as Role[]} />
          </div>

          <div className="flex gap-6 text-xs text-muted-foreground sm:col-span-2">
            <div>
              <span className="block text-[10px] uppercase tracking-widest font-semibold opacity-60">
                Created
              </span>
              {formatDate(fact.createdAt, {
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
              {formatDate(fact.updatedAt, {
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
