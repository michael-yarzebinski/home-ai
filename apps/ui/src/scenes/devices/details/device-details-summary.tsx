import type { Device } from '@home-ai/shared/domain/device/device';
import type { DeviceStatus } from '@home-ai/shared/domain/device/device-status';
import { Role } from '@home-ai/shared/domain/role/role';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleBadgeGroup } from '@/components/role-badge-group/role-badge-group';
import { formatDate } from '@/utils/date.utils';
import { Loader2, Zap } from 'lucide-react';
import { LiveStatusEntities } from './live-status-entities';

interface DeviceDetailsSummaryProps {
  device: Device;
  status?: DeviceStatus;
  statusLoading?: boolean;
  statusError?: Error | null;
}

export function DeviceDetailsSummary({
  device,
  status,
  statusLoading,
  statusError,
}: DeviceDetailsSummaryProps) {
  const aliases = device.aliases ?? [];

  return (
    <Card>
      <CardHeader className="py-4 px-5">
        <CardTitle className="text-sm font-bold uppercase tracking-widest">
          Device details
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-5 pb-5 pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="min-w-0 sm:col-span-2 xl:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
              Friendly name
            </p>
            <p className="text-base font-semibold text-foreground">{device.friendlyName}</p>
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
              System slug
            </p>
            <p className="font-mono text-sm text-muted-foreground break-all">{device.slug}</p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
              Room
            </p>
            <p className="text-sm text-muted-foreground">{device.room || '—'}</p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
              Category
            </p>
            {device.category ? (
              <Badge variant="outline" className="font-normal capitalize">
                {device.category}
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>

          <div className="sm:col-span-2 xl:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Aliases
            </p>
            {aliases.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {aliases.map((alias) => (
                  <Badge key={alias} variant="secondary" className="font-normal">
                    {alias}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No aliases.</p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Read access
            </p>
            <RoleBadgeGroup roles={device.readRoles as Role[]} />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Write access
            </p>
            <RoleBadgeGroup roles={device.writeRoles as Role[]} />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Automation LLM
            </p>
            <Badge
              variant="outline"
              className={device.llmModelType === 'immediate'
                ? "gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-normal"
                : "font-normal"}
            >
              {device.llmModelType === 'immediate' && <Zap className="size-3" />}
              {device.llmModelType === 'immediate' ? 'Immediate' : 'Soon'}
            </Badge>
          </div>

          <div className="flex gap-6 text-xs text-muted-foreground sm:col-span-2 xl:col-span-3">
            <div>
              <span className="block text-[10px] uppercase tracking-widest font-semibold opacity-60">
                Created
              </span>
              {formatDate(device.createdAt, {
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
              {formatDate(device.updatedAt, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              }) ?? '—'}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/20">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Live status
            </p>
            {status?.lastUpdated && (
              <span className="text-[10px] text-muted-foreground">
                Updated{' '}
                {formatDate(status.lastUpdated, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            )}
          </div>

          <div className="px-4 py-3 max-h-[min(28rem,60vh)] overflow-y-auto">
            {statusLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="size-4 animate-spin" />
                Loading status from Home Assistant…
              </div>
            ) : statusError ? (
              <p className="text-sm text-muted-foreground italic">
                {statusError.message || 'Unable to load live status.'}
              </p>
            ) : !status?.entities?.length ? (
              <p className="text-xs text-muted-foreground italic">
                No live entity state reported for this device.
              </p>
            ) : (
              <LiveStatusEntities
                entities={status.entities}
                deviceSlug={status.deviceSlug ?? device.slug}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
