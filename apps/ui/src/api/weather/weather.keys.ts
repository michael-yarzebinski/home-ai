import type { WeatherRequest } from '@home-ai/shared/domain/weather/weather-request';

export const weatherKeys = {
  all: ['weather'] as const,
  query: (req: WeatherRequest) => [...weatherKeys.all, req] as const,
} as const;
