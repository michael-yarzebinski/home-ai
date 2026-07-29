import { useMutation } from '@tanstack/react-query';
import type { WeatherRequest } from '@home-ai/shared/domain/weather/weather-request';
import { weatherApi } from '@/api/weather/weather.api';

export function useGetWeather() {
  return useMutation({
    mutationFn: (body: WeatherRequest) => weatherApi.getWeather(body),
  });
}
