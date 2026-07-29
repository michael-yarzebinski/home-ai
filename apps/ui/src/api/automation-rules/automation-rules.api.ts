import type {
  AutomationRule,
  InsertableAutomationRule,
  UpdatableAutomationRule,
} from '@home-ai/shared/domain/automation-rule/automation-rule';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/automation-rules';

export const automationRulesApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<AutomationRule>>(`${BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<AutomationRule>(`${BASE}/${encodeURIComponent(id)}`),

  create: (body: InsertableAutomationRule) =>
    apiClient.post<AutomationRule>(BASE, body),

  update: (id: string, body: UpdatableAutomationRule) =>
    apiClient.put<AutomationRule>(`${BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
