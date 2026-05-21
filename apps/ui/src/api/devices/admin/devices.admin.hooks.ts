import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Device } from '@home-ai/shared/domain/device/device';
import { devicesAdminApi } from '@/api/devices/admin/devices.admin.api';
import { adminDeviceKeys } from '@/api/devices/admin/devices.admin.keys';
import { deviceKeys } from '@/api/devices/devices.keys';
import type { Paginated } from '@home-ai/shared/search/pagination';

export function useAdminDeviceSearch<TData = Paginated<Device>>(
  criteria: SearchCriteriaBase,
  options?: Omit<UseQueryOptions<Paginated<Device>, Error, TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: adminDeviceKeys.list(criteria),
    queryFn: () => devicesAdminApi.search(criteria),
    ...options,
  });
}

export function useAdminDeviceById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminDeviceKeys.detail(id ?? ''),
    queryFn: () => devicesAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminDeviceRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devicesAdminApi.restore(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminDeviceKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminDeviceKeys.lists() });
      void qc.invalidateQueries({ queryKey: deviceKeys.lists() });
      void qc.invalidateQueries({ queryKey: deviceKeys.detail(id) });
    },
  });
}
