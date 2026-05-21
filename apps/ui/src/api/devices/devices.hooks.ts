import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import type { Device, UpdatableDevice } from '@home-ai/shared/domain/device/device';
import { devicesApi } from '@/api/devices/devices.api';
import { deviceKeys } from '@/api/devices/devices.keys';
import { adminDeviceKeys } from '@/api/devices/admin/devices.admin.keys';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';

export function useDeviceSearch<TData = Paginated<Device>>(
  criteria: SearchCriteriaBase,
  options?: Omit<UseQueryOptions<Paginated<Device>, Error, TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    ...options,
    queryKey: deviceKeys.list(criteria),
    queryFn: () => devicesApi.search(criteria),
  });
}

export function useDeviceById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: deviceKeys.detail(id ?? ''),
    queryFn: () => devicesApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableDevice }) =>
      devicesApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: deviceKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: deviceKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminDeviceKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminDeviceKeys.detail(id) });
    },
  });
}

export function useSoftDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devicesApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: deviceKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: deviceKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminDeviceKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminDeviceKeys.detail(id) });
    },
  });
}
