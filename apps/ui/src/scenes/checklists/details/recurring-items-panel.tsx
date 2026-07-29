import { Plus, Repeat } from 'lucide-react';
import type { RecurringChecklistItem } from '@home-ai/shared/domain/checklist/recurring-checklist-item';
import { RecurringChecklistItemTriggerType } from '@home-ai/shared/domain/checklist/recurring-checklist-item';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PriorityBadge } from '../components/priority-badge';
import { getCronDisplayLabel } from '@/utils/cron.utils';

interface RecurringItemsPanelProps {
  recurringItems: RecurringChecklistItem[];
  assigneeNameById: Map<string, string>;
  canWrite?: boolean;
  onAddClick?: () => void;
  onItemClick?: (item: RecurringChecklistItem) => void;
}

function formatTrigger(item: RecurringChecklistItem): string {
  const cfg = item.triggerConfig ?? {};
  if (item.triggerType === RecurringChecklistItemTriggerType.CRON) {
    return cfg.cron ? getCronDisplayLabel(cfg.cron) : 'Schedule not configured';
  }
  const parts = [cfg.eventTag && `Event: ${cfg.eventTag}`, cfg.dueInDays != null && `Due in ${cfg.dueInDays}d`].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(' · ') : 'Event (not configured)';
}

export function RecurringItemsPanel({
  recurringItems,
  assigneeNameById,
  canWrite,
  onAddClick,
  onItemClick,
}: RecurringItemsPanelProps) {
  const activeRecurring = recurringItems.filter((r) => r.active !== false);

  return (
    <Card className="flex flex-col min-h-0 h-full overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Repeat className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Recurring items</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Active blueprints ({activeRecurring.length})
            </CardDescription>
          </div>
          {canWrite && onAddClick && (
            <Button
              size="sm"
              className="shrink-0 text-xs font-bold uppercase tracking-wider"
              onClick={onAddClick}
            >
              <Plus className="size-3.5 mr-1.5" />
              Add recurring
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3 pr-2 pb-4 min-h-0">
        {activeRecurring.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No active recurring items.</p>
        ) : (
          activeRecurring.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemClick?.(item)}
              className="w-full text-left rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 space-y-1.5 transition-colors hover:border-border hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{item.title}</span>
                <PriorityBadge priority={item.priority} />
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              )}
              <p className="text-[11px] text-muted-foreground">{formatTrigger(item)}</p>
              <p className="text-[11px] text-muted-foreground">
                Default assignee:{' '}
                {item.defaultAssigneeId
                  ? assigneeNameById.get(item.defaultAssigneeId) ?? 'Assigned user'
                  : 'Unassigned'}
              </p>
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] font-normal h-5 px-1.5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
