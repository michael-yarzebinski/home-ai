import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type {
  InsertableAppConfig,
  UpdatableAppConfig,
} from '@home-ai/shared/domain/app-config/app-config';
import { appConfigAdminApi } from '@/api/app-config/admin/app-config.admin.api';
import { adminAppConfigKeys } from '@/api/app-config/admin/app-config.admin.keys';
import { appConfigKeys } from '@/api/app-config/app-config.keys';

export function useAdminAppConfigSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminAppConfigKeys.list(criteria),
    queryFn: () => appConfigAdminApi.search(criteria),
  });
}

export function useAdminAppConfigById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminAppConfigKeys.detail(id ?? ''),
    queryFn: () => appConfigAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminAppConfigCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InsertableAppConfig) => appConfigAdminApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminAppConfigKeys.lists() });
      void qc.invalidateQueries({ queryKey: appConfigKeys.list() });
    },
  });
}

export function useAdminAppConfigUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableAppConfig }) =>
      appConfigAdminApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: adminAppConfigKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminAppConfigKeys.lists() });
      void qc.invalidateQueries({ queryKey: appConfigKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: appConfigKeys.list() });
    },
  });
}

export function useAdminSoftDeleteAppConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appConfigAdminApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminAppConfigKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminAppConfigKeys.lists() });
      void qc.invalidateQueries({ queryKey: appConfigKeys.list() });
    },
  });
}

export function useAdminAppConfigRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appConfigAdminApi.restore(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminAppConfigKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminAppConfigKeys.lists() });
      void qc.invalidateQueries({ queryKey: appConfigKeys.list() });
    },
  });
}
