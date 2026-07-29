import { useInfiniteQuery, useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { DeviceEvent } from '@home-ai/shared/domain/device/device-event';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { deviceEventsApi } from '@/api/device-events/device-events.api';
import { deviceEventKeys } from '@/api/device-events/device-events.keys';

export function useDeviceEventSearch<TData = Paginated<DeviceEvent>>(
  criteria: SearchCriteriaBase,
  options?: Omit<
    UseQueryOptions<Paginated<DeviceEvent>, Error, TData>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    ...options,
    queryKey: deviceEventKeys.list(criteria),
    queryFn: () => deviceEventsApi.search(criteria),
  });
}

/** Paginated device events (newest first), with infinite scroll support. */
export function useDeviceEventsInfiniteForDevice(
  deviceId: string | undefined,
  pageSize = 20,
  enabled = true,
) {
  const criteria = { pageSize };

  return useInfiniteQuery({
    queryKey: [...deviceEventKeys.all, 'by-device-infinite', deviceId ?? '', criteria] as const,
    queryFn: ({ pageParam = 1 }) =>
      deviceEventsApi.getByDeviceId(deviceId!, { ...criteria, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loadedSoFar = allPages.flatMap((p) => p.items).length;
      return loadedSoFar < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled: enabled && Boolean(deviceId),
  });
}
