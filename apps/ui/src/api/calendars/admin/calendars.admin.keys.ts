import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminCalendarKeys = {
  all: ['admin', 'calendars'] as const,
  lists: () => [...adminCalendarKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminCalendarKeys.lists(), criteria] as const,
  details: () => [...adminCalendarKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminCalendarKeys.details(), id] as const,
} as const;
