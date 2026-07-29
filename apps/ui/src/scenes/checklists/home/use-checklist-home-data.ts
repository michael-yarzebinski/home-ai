import { useEffect, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { ChecklistDetails } from '@home-ai/shared/domain/checklist/checklist-details';
import { checklistsApi } from '@/api/checklists/checklists.api';
import { useChecklistInfinite } from '@/api/checklists/checklists.hooks';
import { checklistKeys } from '@/api/checklists/checklists.keys';
import type { ChecklistItem } from '@home-ai/shared/domain/checklist/checklist-item';
import { getOpenTodoItems, partitionTodosForUser } from '../details/checklist-item-utils';

export function useChecklistHomeData(userId: string | undefined) {
  const {
    data: checklistPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingChecklists,
  } = useChecklistInfinite({ query: '', pageSize: 100 });

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const checklists = useMemo(
    () => checklistPages?.pages.flatMap((p) => p.items) ?? [],
    [checklistPages],
  );

  const detailQueries = useQueries({
    queries: checklists.map((checklist) => ({
      queryKey: checklistKeys.detail(checklist.id),
      queryFn: () => checklistsApi.getById(checklist.id),
      enabled: Boolean(checklist.id),
    })),
  });

  const isLoadingDetails =
    checklists.length > 0 && detailQueries.some((q) => q.isLoading);

  const todos = useMemo(() => {
    const rows: ChecklistItem[] = [];
    for (const query of detailQueries) {
      const detail = query.data;
      if (!detail) continue;
      rows.push(...openTodosFromDetail(detail));
    }
    return rows;
  }, [detailQueries]);

  const { assigned, other } = useMemo(
    () => partitionTodosForUser(todos, userId),
    [todos, userId],
  );

  const sortedChecklists = useMemo(
    () => [...checklists].sort((a, b) => a.name.localeCompare(b.name)),
    [checklists],
  );

  return {
    checklists: sortedChecklists,
    assignedTodos: assigned,
    otherTodos: other,
    isLoading: isLoadingChecklists || isLoadingDetails,
    isLoadingChecklists,
    isLoadingDetails,
  };
}

function openTodosFromDetail(detail: ChecklistDetails): ChecklistItem[] {
  return getOpenTodoItems(detail.checklistItems);
}
