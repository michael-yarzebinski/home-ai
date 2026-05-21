import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const calendarKeys = {
  all: ['calendars'] as const,
  lists: () => [...calendarKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...calendarKeys.lists(), criteria] as const,
  details: () => [...calendarKeys.all, 'detail'] as const,
  detail: (id: string) => [...calendarKeys.details(), id] as const,
} as const;
