import { ChecklistItemPriority } from '@home-ai/shared/domain/checklist/checklist-item';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { capitalizeFirst } from '@/utils/string.utils';

const PRIORITY_BADGE_CLASS: Record<ChecklistItemPriority, string> = {
  [ChecklistItemPriority.CRITICAL]:
    'border-red-700/60 bg-red-700/15 text-red-800 dark:text-red-300',
  [ChecklistItemPriority.HIGH]:
    'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400',
  [ChecklistItemPriority.MEDIUM]:
    'border-amber-400/50 bg-amber-400/15 text-amber-900 dark:text-amber-200',
  [ChecklistItemPriority.LOW]:
    'border-slate-400/40 bg-slate-500/10 text-slate-600 dark:text-slate-400',
};

export interface PriorityBadgeProps {
  priority: ChecklistItemPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] font-bold uppercase px-2 py-0 h-5',
        PRIORITY_BADGE_CLASS[priority],
        className,
      )}
    >
      {capitalizeFirst(priority)}
    </Badge>
  );
}
