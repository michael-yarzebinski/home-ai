import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminNotificationLogKeys = {
  all: ['admin', 'notification-log'] as const,
  lists: () => [...adminNotificationLogKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) =>
    [...adminNotificationLogKeys.lists(), criteria] as const,
  details: () => [...adminNotificationLogKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminNotificationLogKeys.details(), id] as const,
} as const;
