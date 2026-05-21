import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CallService } from '@home-ai/shared/domain/device/call-service';
import { homeAssistantApi } from '@/api/home-assistant/home-assistant.api';
import { homeAssistantKeys } from '@/api/home-assistant/home-assistant.keys';

export function useHomeAssistantDeviceStatus(
  deviceId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: homeAssistantKeys.deviceStatus(deviceId ?? ''),
    queryFn: () => homeAssistantApi.getDeviceStatus(deviceId!),
    enabled: enabled && Boolean(deviceId),
  });
}

export function useHomeAssistantCallService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CallService) => homeAssistantApi.callService(body),
    onSuccess: (_data, body) => {
      void qc.invalidateQueries({
        queryKey: homeAssistantKeys.deviceStatus(body.deviceId),
      });
    },
  });
}
