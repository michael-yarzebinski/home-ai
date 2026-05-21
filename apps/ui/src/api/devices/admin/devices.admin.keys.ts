import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminDeviceKeys = {
  all: ['admin', 'devices'] as const,
  lists: () => [...adminDeviceKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminDeviceKeys.lists(), criteria] as const,
  details: () => [...adminDeviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminDeviceKeys.details(), id] as const,
} as const;
