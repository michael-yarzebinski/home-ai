import type { SearchCriteriaBase } from '@home-ai/shared/search/search';

export const adminAutomationRuleKeys = {
  all: ['admin', 'automation-rules'] as const,
  lists: () => [...adminAutomationRuleKeys.all, 'list'] as const,
  list: (criteria: SearchCriteriaBase) => [...adminAutomationRuleKeys.lists(), criteria] as const,
  details: () => [...adminAutomationRuleKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminAutomationRuleKeys.details(), id] as const,
} as const;
