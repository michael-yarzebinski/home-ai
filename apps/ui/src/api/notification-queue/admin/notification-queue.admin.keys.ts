import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminNotificationQueueKeys = {
  all: ['admin', 'notification-queue'] as const,
  lists: () => [...adminNotificationQueueKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) =>
    [...adminNotificationQueueKeys.lists(), criteria] as const,
  details: () => [...adminNotificationQueueKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminNotificationQueueKeys.details(), id] as const,
} as const;
