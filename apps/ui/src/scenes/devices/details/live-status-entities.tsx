import { useMemo, useState } from 'react';
import type { EntityStatus } from '@home-ai/shared/domain/device/device-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/date.utils';
import {
  formatHomeAssistantEntityName,
  parseHomeAssistantEntityId,
  sortHomeAssistantEntities,
} from '@/utils/home-assistant-entity.utils';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface LiveStatusEntitiesProps {
  entities: EntityStatus[];
  deviceSlug: string;
}

function EntityTypeBadge({ domain }: { domain: string }) {
  return (
    <Badge variant="outline" className="shrink-0 text-[10px] font-normal uppercase px-1.5 py-0">
      {domain.replace(/_/g, ' ')}
    </Badge>
  );
}

function LiveStatusEntityRow({
  entity,
  deviceSlug,
  expanded,
  onToggle,
}: {
  entity: EntityStatus;
  deviceSlug: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { domain } = parseHomeAssistantEntityId(entity.entityId);
  const label = formatHomeAssistantEntityName(entity.entityId, deviceSlug);
  const hasDetails =
    Boolean(entity.lastChanged) ||
    (entity.attributes && Object.keys(entity.attributes).length > 0);

  return (
    <div className="rounded-lg border border-border/50 bg-background/50 px-2.5 py-2 space-y-2">
      <div className="flex items-center gap-1.5 min-w-0">
        {hasDetails ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={expanded ? 'Hide entity details' : 'Show entity details'}
          >
            {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </Button>
        ) : (
          <span className="size-6 shrink-0" aria-hidden />
        )}

        <p className="min-w-0 flex-1 text-sm leading-snug">
          <span className="font-medium text-foreground">{label}</span>
          <span className="text-muted-foreground">: </span>
          <span className="font-mono text-xs text-foreground uppercase">{entity.state}</span>
        </p>

        <EntityTypeBadge domain={domain} />
      </div>

      {expanded && hasDetails && (
        <div className="ml-7 space-y-2 border-t border-border/40 pt-2">
          {entity.lastChanged && (
            <p className="text-[10px] text-muted-foreground">
              Changed{' '}
              {formatDate(entity.lastChanged, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
          )}
          {entity.attributes && Object.keys(entity.attributes).length > 0 && (
            <pre
              className={cn(
                'text-[10px] font-mono text-muted-foreground overflow-x-auto',
                'max-h-32 rounded bg-muted/30 p-2 border border-border/30',
              )}
            >
              {JSON.stringify(entity.attributes, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export function LiveStatusEntities({ entities, deviceSlug }: LiveStatusEntitiesProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const sortedEntities = useMemo(
    () => sortHomeAssistantEntities(entities, deviceSlug),
    [entities, deviceSlug],
  );

  const toggleExpanded = (entityId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entityId)) next.delete(entityId);
      else next.add(entityId);
      return next;
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {sortedEntities.map((entity) => (
        <LiveStatusEntityRow
          key={entity.entityId}
          entity={entity}
          deviceSlug={deviceSlug}
          expanded={expandedIds.has(entity.entityId)}
          onToggle={() => toggleExpanded(entity.entityId)}
        />
      ))}
    </div>
  );
}
