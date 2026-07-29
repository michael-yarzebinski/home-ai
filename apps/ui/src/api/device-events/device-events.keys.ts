import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const deviceEventKeys = {
  all: ['device-events'] as const,
  lists: () => [...deviceEventKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...deviceEventKeys.lists(), criteria] as const,
  byDevice: (deviceId: string, criteria: SearchCriteriaBase) =>
    [...deviceEventKeys.all, 'by-device', deviceId, criteria] as const,
} as const;
