import type {
  AutomationRule,
  InsertableAutomationRule,
} from '@home-ai/shared/domain/automation-rule/automation-rule';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';
import { automationRulesApi } from '@/api/automation-rules/automation-rules.api';

const ADMIN_BASE = '/v1/admin/automation-rules';

/** Admin routes differ from app for search/get/create/restore; writes use app `PUT`/`DELETE`. */
export const automationRulesAdminApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<AutomationRule>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<AutomationRule>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  create: (body: InsertableAutomationRule) =>
    apiClient.post<AutomationRule>(ADMIN_BASE, body),

  restore: (id: string) =>
    apiClient.post<AutomationRule>(
      `${ADMIN_BASE}/${encodeURIComponent(id)}/restore`,
    ),

  update: automationRulesApi.update,
  softDelete: automationRulesApi.softDelete,
} as const;
