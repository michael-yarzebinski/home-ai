import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User } from 'lucide-react';
import type { ChecklistItem } from '@home-ai/shared/domain/checklist/checklist-item';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { capitalizeFirst } from '@/utils/string.utils';
import { formatDate, parseApiDate } from '@/utils/date.utils';
import { useChecklistDetail } from '@/api/checklists/checklists.hooks';
import { useUserSearch } from '@/api/users/users.hooks';
import { PriorityBadge } from '../components/priority-badge';
import { StatusBadge } from '../components/status-badge';
import { isItemChecked } from './checklist-item-utils';

const checklistNameClassName =
  'text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors';

const rowClickableClassName =
  'text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm';

export interface ChecklistItemRowProps {
  item: ChecklistItem;
  showChecklistName?: boolean;
  isTogglePending?: boolean;
  onToggleCheck: (item: ChecklistItem, checked: boolean) => void;
  onRowClick: (item: ChecklistItem) => void;
}

export function ChecklistItemRow({
  item,
  showChecklistName = false,
  isTogglePending,
  onToggleCheck,
  onRowClick,
}: ChecklistItemRowProps) {
  const checked = isItemChecked(item);
  const needsUserSearch = Boolean(item.assigneeId) || Boolean(checked && item.completedBy);
  const {
    data: usersPage,
    isLoading: usersLoading,
    isFetching: usersFetching,
  } = useUserSearch(
    { query: '', page: 1, pageSize: 100 },
    { enabled: needsUserSearch },
  );
  const usersById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of usersPage?.items ?? []) {
      map.set(u.id, u.name);
    }
    return map;
  }, [usersPage?.items]);
  const usersPending = needsUserSearch && (usersLoading || usersFetching);
  const assigneeName = item.assigneeId ? usersById.get(item.assigneeId) : undefined;
  const completedByName =
    checked && item.completedBy ? usersById.get(item.completedBy) : undefined;
  const {
    data: checklistDetail,
    isLoading: checklistLoading,
    isFetching: checklistFetching,
  } = useChecklistDetail(item.checklistId, showChecklistName);
  const checklistNameLabel = checklistDetail?.checklist.name;
  const dueParsed = parseApiDate(item.dueDate);
  const dueLabel = formatDate(item.dueDate, {
    month: 'short',
    day: 'numeric',
    year:
      dueParsed && dueParsed.getFullYear() !== new Date().getFullYear()
        ? 'numeric'
        : undefined,
  });
  const completedLabel = formatDate(item.completedAt, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'group flex gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-3 transition-colors',
        'hover:border-border hover:bg-accent/30',
        checked && 'opacity-80',
      )}
    >
      <div
        className="flex shrink-0 items-start pt-0.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={checked}
          disabled={isTogglePending}
          aria-label={checked ? `Mark "${item.title}" incomplete` : `Mark "${item.title}" complete`}
          className="h-5 w-5"
          onCheckedChange={(value) => {
            onToggleCheck(item, value === true);
          }}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onRowClick(item)}
            className={cn(rowClickableClassName, 'inline-flex flex-wrap items-center gap-2 min-w-0')}
          >
            <span
              className={cn(
                'text-sm font-semibold text-foreground leading-snug',
                checked && 'line-through text-muted-foreground',
              )}
            >
              {capitalizeFirst(item.title)}
            </span>
            <PriorityBadge priority={item.priority} />
            <StatusBadge status={item.status} />
          </button>
          {showChecklistName && (
            <Link
              to={`/checklists/details/${item.checklistId}`}
              className={checklistNameClassName}
            >
              {checklistLoading || checklistFetching
                ? '…'
                : capitalizeFirst(checklistNameLabel ?? 'Checklist')}
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRowClick(item)}
          className={cn(rowClickableClassName, 'w-full min-w-0 block')}
        >
          {item.description && (
            <p
              className={cn(
                'text-xs text-muted-foreground line-clamp-2',
                checked && 'line-through decoration-muted-foreground/50',
              )}
            >
              {capitalizeFirst(item.description)}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="size-3 opacity-60" />
              {!item.assigneeId
                ? 'Unassigned'
                : usersPending
                  ? '…'
                  : (assigneeName ?? 'Assigned user')}
            </span>
            {dueLabel && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3 opacity-60" />
                Due {dueLabel}
              </span>
            )}
            {checked && completedLabel && (
              <span>
                Done {completedLabel}
                {usersPending
                  ? ' · …'
                  : completedByName
                    ? ` · ${completedByName}`
                    : null}
              </span>
            )}
          </div>

          {item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] font-normal px-1.5 py-0 h-5"
                >
                  {capitalizeFirst(tag)}
                </Badge>
              ))}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
