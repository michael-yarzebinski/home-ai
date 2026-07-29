import type { WeatherRequest } from '@home-ai/shared/domain/weather/weather-request';
import { apiClient } from '@/api/client';

const BASE = '/v1/weather';

export const weatherApi = {
  getWeather: (body: WeatherRequest) =>
    apiClient.post<unknown>(`${BASE}/get-weather`, body),
} as const;
