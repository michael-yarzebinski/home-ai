import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Device } from '@home-ai/shared/domain/device/device';
import type { DeviceStatus, EntityStatus } from '@home-ai/shared/domain/device/device-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Loader2, Plug, Zap } from 'lucide-react';
import {
  formatHomeAssistantEntityName,
  partitionHomeAssistantEntities,
} from '@/utils/home-assistant-entity.utils';

interface DeviceHomeCardProps {
  device: Device;
  status: DeviceStatus | undefined;
  statusLoading: boolean;
  statusError: Error | null;
}

function StatusEntityRow({
  entity,
  deviceSlug,
}: {
  entity: EntityStatus;
  deviceSlug: string;
}) {
  const label = formatHomeAssistantEntityName(entity.entityId, deviceSlug);

  return (
    <li
      className="text-sm leading-snug truncate"
      title={`${label}: ${entity.state}`}
    >
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-muted-foreground">: </span>
      <span className="font-mono text-xs uppercase text-foreground">{entity.state}</span>
    </li>
  );
}

export function DeviceHomeCard({
  device,
  status,
  statusLoading,
  statusError,
}: DeviceHomeCardProps) {
  const [showOthers, setShowOthers] = useState(false);
  const deviceSlug = status?.deviceSlug ?? device.slug;
  const entities = status?.entities ?? [];
  const { sensors, others } = partitionHomeAssistantEntities(entities, deviceSlug);
  const hasStatusContent = sensors.length > 0 || others.length > 0;

  const toggleOthers = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setShowOthers((prev) => !prev);
  };

  return (
    <Link to={`/devices/details/${device.id}`} className="block h-full">
      <Card className="h-full transition-colors hover:border-border hover:bg-accent/20">
        <CardHeader className="pb-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Plug className="size-4 text-muted-foreground shrink-0" />
              <CardTitle className="text-base font-semibold tracking-tight truncate">
                {device.friendlyName}
              </CardTitle>
            </div>
            {device.llmModelType === 'immediate' && (
              <Badge
                variant="outline"
                className="shrink-0 gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-normal"
              >
                <Zap className="size-3" />
                Immediate
              </Badge>
            )}
          </div>
          <CardDescription className="space-y-1.5">
            <span className="block font-mono text-[10px] text-muted-foreground/80 truncate">
              {device.slug}
            </span>
            <span className="flex flex-wrap gap-1.5">
              {device.room && (
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {device.room}
                </Badge>
              )}
              {device.category && (
                <Badge variant="outline" className="text-[10px] font-normal capitalize">
                  {device.category}
                </Badge>
              )}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Live status
          </p>

          {statusLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
              <Loader2 className="size-3.5 animate-spin" />
              Loading status…
            </div>
          ) : statusError ? (
            <p className="text-xs text-muted-foreground italic py-2">
              Status unavailable
            </p>
          ) : !hasStatusContent ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No live state reported
            </p>
          ) : (
            <div className="space-y-1.5">
              {sensors.length > 0 && (
                <ul className="space-y-1.5">
                  {sensors.map((entity) => (
                    <StatusEntityRow
                      key={entity.entityId}
                      entity={entity}
                      deviceSlug={deviceSlug}
                    />
                  ))}
                </ul>
              )}

              {others.length > 0 && (
                <div className="space-y-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 -ml-2 text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={toggleOthers}
                    aria-expanded={showOthers}
                  >
                    {showOthers ? (
                      <>
                        <ChevronUp className="size-3" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-3" />
                        Show all ({others.length})
                      </>
                    )}
                  </Button>

                  {showOthers && (
                    <ul className="space-y-1.5">
                      {others.map((entity) => (
                        <StatusEntityRow
                          key={entity.entityId}
                          entity={entity}
                          deviceSlug={deviceSlug}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
