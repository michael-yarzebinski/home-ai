import type { CallService } from '@home-ai/shared/domain/device/call-service';
import type { DeviceStatus } from '@home-ai/shared/domain/device/device-status';
import { apiClient } from '@/api/client';

const BASE = '/v1/home-assistant';

export const homeAssistantApi = {
  getDeviceStatus: (deviceId: string) =>
    apiClient.get<DeviceStatus>(
      `${BASE}/device-status/${encodeURIComponent(deviceId)}`,
    ),

  callService: (body: CallService) =>
    apiClient.post<unknown>(`${BASE}/call-service`, body),
} as const;
