import {
  ChecklistItem,
  ChecklistItemPriority,
  ChecklistItemStatus,
} from '@home-ai/shared/domain/checklist/checklist-item';
import { parseApiDate } from '@/utils/date.utils';

const PRIORITY_RANK: Record<ChecklistItemPriority, number> = {
  [ChecklistItemPriority.CRITICAL]: 0,
  [ChecklistItemPriority.HIGH]: 1,
  [ChecklistItemPriority.MEDIUM]: 2,
  [ChecklistItemPriority.LOW]: 3,
};

const ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Checked = has a completion timestamp (matches check/uncheck API behavior). */
export function isItemChecked(item: ChecklistItem): boolean {
  return parseApiDate(item.completedAt) != null;
}

export function isActiveItem(item: ChecklistItem): boolean {
  const completedAt = parseApiDate(item.completedAt);
  if (!completedAt) return true;
  return Date.now() - completedAt.getTime() < ACTIVE_WINDOW_MS;
}

function compareOpenItems(a: ChecklistItem, b: ChecklistItem): number {
  const pr =
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (pr !== 0) return pr;

  const aDue = parseApiDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bDue = parseApiDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  if (aDue !== bDue) return aDue - bDue;

  if (a.status === ChecklistItemStatus.BLOCKED && b.status !== ChecklistItemStatus.BLOCKED) {
    return 1;
  }
  if (b.status === ChecklistItemStatus.BLOCKED && a.status !== ChecklistItemStatus.BLOCKED) {
    return -1;
  }

  return a.title.localeCompare(b.title);
}

function compareCheckedItems(a: ChecklistItem, b: ChecklistItem): number {
  const aAt = parseApiDate(a.completedAt)?.getTime() ?? 0;
  const bAt = parseApiDate(b.completedAt)?.getTime() ?? 0;
  return bAt - aAt;
}

export function partitionChecklistItems(items: ChecklistItem[]): {
  open: ChecklistItem[];
  checked: ChecklistItem[];
} {
  const open: ChecklistItem[] = [];
  const checked: ChecklistItem[] = [];

  for (const item of items) {
    if (isItemChecked(item)) {
      checked.push(item);
    } else {
      open.push(item);
    }
  }

  open.sort(compareOpenItems);
  checked.sort(compareCheckedItems);

  return { open, checked };
}

export function filterVisibleItems(
  items: ChecklistItem[],
  showAllHistory: boolean,
): ChecklistItem[] {
  const activeOnly = items.filter((item) => item.active !== false);
  if (showAllHistory) return activeOnly;
  return activeOnly.filter(isActiveItem);
}

/** Open (unchecked) items from the active-only set used on checklist home. */
export function getOpenTodoItems(items: ChecklistItem[]): ChecklistItem[] {
  return partitionChecklistItems(filterVisibleItems(items, false)).open;
}

export function partitionTodosForUser(
  items: ChecklistItem[],
  userId: string | undefined,
): { assigned: ChecklistItem[]; other: ChecklistItem[] } {
  const assigned: ChecklistItem[] = [];
  const other: ChecklistItem[] = [];
  for (const item of items) {
    if (userId && item.assigneeId === userId) assigned.push(item);
    else other.push(item);
  }
  return { assigned, other };
}
