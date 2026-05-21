import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type {
  InsertableAutomationRule,
  UpdatableAutomationRule,
} from '@home-ai/shared/domain/automation-rule/automation-rule';
import { automationRulesApi } from '@/api/automation-rules/automation-rules.api';
import { automationRuleKeys } from '@/api/automation-rules/automation-rules.keys';
import { adminAutomationRuleKeys } from '@/api/automation-rules/admin/automation-rules.admin.keys';

export function useAutomationRuleSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: automationRuleKeys.list(criteria),
    queryFn: () => automationRulesApi.search(criteria),
  });
}

export function useAutomationRuleById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: automationRuleKeys.detail(id ?? ''),
    queryFn: () => automationRulesApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useCreateAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InsertableAutomationRule) => automationRulesApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: automationRuleKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminAutomationRuleKeys.lists() });
    },
  });
}

export function useUpdateAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableAutomationRule }) =>
      automationRulesApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: automationRuleKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: automationRuleKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminAutomationRuleKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminAutomationRuleKeys.detail(id) });
    },
  });
}

export function useSoftDeleteAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationRulesApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: automationRuleKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: automationRuleKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminAutomationRuleKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminAutomationRuleKeys.detail(id) });
    },
  });
}
