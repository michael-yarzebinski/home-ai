export const pendingActionKeys = {
  all: ['pending-actions'] as const,
  lists: () => [...pendingActionKeys.all, 'list'] as const,
  list: () => [...pendingActionKeys.lists(), 'default'] as const,
  details: () => [...pendingActionKeys.all, 'detail'] as const,
  detail: (id: string) => [...pendingActionKeys.details(), id] as const,
} as const;
