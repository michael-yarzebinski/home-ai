import { useEffect, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { Device } from '@home-ai/shared/domain/device/device';
import type { DeviceStatus } from '@home-ai/shared/domain/device/device-status';
import { useDeviceInfinite } from '@/api/devices/devices.hooks';
import { homeAssistantApi } from '@/api/home-assistant/home-assistant.api';
import { homeAssistantKeys } from '@/api/home-assistant/home-assistant.keys';

export type DeviceWithStatus = {
  device: Device;
  status: DeviceStatus | undefined;
  statusLoading: boolean;
  statusError: Error | null;
};

export function useDeviceHomeData() {
  const {
    data: devicePages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingDevices,
  } = useDeviceInfinite({ query: '', pageSize: 100 });

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const devices = useMemo(
    () => devicePages?.pages.flatMap((p) => p.items) ?? [],
    [devicePages],
  );

  const sortedDevices = useMemo(
    () => [...devices].sort((a, b) => a.friendlyName.localeCompare(b.friendlyName)),
    [devices],
  );

  const statusQueries = useQueries({
    queries: sortedDevices.map((device) => ({
      queryKey: homeAssistantKeys.deviceStatus(device.id),
      queryFn: () => homeAssistantApi.getDeviceStatus(device.id),
      enabled: Boolean(device.id),
      staleTime: 30_000,
    })),
  });

  const devicesWithStatus = useMemo<DeviceWithStatus[]>(
    () =>
      sortedDevices.map((device, index) => ({
        device,
        status: statusQueries[index]?.data,
        statusLoading: statusQueries[index]?.isLoading ?? false,
        statusError: statusQueries[index]?.error ?? null,
      })),
    [sortedDevices, statusQueries],
  );

  const isLoadingStatus =
    sortedDevices.length > 0 && statusQueries.some((q) => q.isLoading);

  return {
    devicesWithStatus,
    isLoading: isLoadingDevices || isLoadingStatus,
    isLoadingDevices,
    isLoadingStatus,
  };
}
