export const chatSessionKeys = {
  all: ['chat-sessions'] as const,
  lists: () => [...chatSessionKeys.all, 'list'] as const,
  list: () => [...chatSessionKeys.lists(), 'default'] as const,
  details: () => [...chatSessionKeys.all, 'detail'] as const,
  detail: (id: string) => [...chatSessionKeys.details(), id] as const,
} as const;
