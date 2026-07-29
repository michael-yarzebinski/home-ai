export const appConfigKeys = {
  all: ['app-config'] as const,
  lists: () => [...appConfigKeys.all, 'list'] as const,
  list: () => [...appConfigKeys.lists(), 'all'] as const,
  details: () => [...appConfigKeys.all, 'detail'] as const,
  detail: (id: string) => [...appConfigKeys.details(), id] as const,
} as const;
