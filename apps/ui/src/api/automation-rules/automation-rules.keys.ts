import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const automationRuleKeys = {
  all: ['automation-rules'] as const,
  lists: () => [...automationRuleKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...automationRuleKeys.lists(), criteria] as const,
  details: () => [...automationRuleKeys.all, 'detail'] as const,
  detail: (id: string) => [...automationRuleKeys.details(), id] as const,
} as const;
