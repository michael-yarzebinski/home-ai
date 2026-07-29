import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { InsertableAutomationRule } from '@home-ai/shared/domain/automation-rule/automation-rule';
import { automationRulesAdminApi } from '@/api/automation-rules/admin/automation-rules.admin.api';
import { adminAutomationRuleKeys } from '@/api/automation-rules/admin/automation-rules.admin.keys';
import { automationRuleKeys } from '@/api/automation-rules/automation-rules.keys';

export function useAdminAutomationRuleSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminAutomationRuleKeys.list(criteria),
    queryFn: () => automationRulesAdminApi.search(criteria),
  });
}

export function useAdminAutomationRuleById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminAutomationRuleKeys.detail(id ?? ''),
    queryFn: () => automationRulesAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminAutomationRuleCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InsertableAutomationRule) =>
      automationRulesAdminApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminAutomationRuleKeys.lists() });
      void qc.invalidateQueries({ queryKey: automationRuleKeys.lists() });
    },
  });
}

export function useAdminAutomationRuleRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationRulesAdminApi.restore(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminAutomationRuleKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminAutomationRuleKeys.lists() });
      void qc.invalidateQueries({ queryKey: automationRuleKeys.lists() });
      void qc.invalidateQueries({ queryKey: automationRuleKeys.detail(id) });
    },
  });
}
