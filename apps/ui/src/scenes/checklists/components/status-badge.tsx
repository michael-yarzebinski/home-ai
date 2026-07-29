import { ChecklistItemStatus } from '@home-ai/shared/domain/checklist/checklist-item';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { capitalizeFirst } from '@/utils/string.utils';

const BLOCKED_BADGE_CLASS =
  'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300';

export interface StatusBadgeProps {
  status: ChecklistItemStatus;
  className?: string;
}

/** Renders only when {@link ChecklistItemStatus.BLOCKED}; pending/completed show nothing. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (status !== ChecklistItemStatus.BLOCKED) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] font-bold uppercase px-2 py-0 h-5',
        BLOCKED_BADGE_CLASS,
        className,
      )}
    >
      {capitalizeFirst(status)}
    </Badge>
  );
}
