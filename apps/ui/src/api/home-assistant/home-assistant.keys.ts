export const homeAssistantKeys = {
  all: ['home-assistant'] as const,
  deviceStatus: (deviceId: string) =>
    [...homeAssistantKeys.all, 'device-status', deviceId] as const,
} as const;
