import { Injectable } from '@nestjs/common';
import { LogStore } from '../../core/stores/log/log.store';
import axios from 'axios';

@Injectable()
export class WeatherService {
  private readonly geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search';
  private readonly weatherUrl = 'https://api.open-meteo.com/v1/forecast';

  constructor(
    private readonly logStore: LogStore,
  ) { }

  /**
   * Get current weather + forecast for a given number of days.
   */
  async getWeather(zipCode: string, forecastDays: number = 2): Promise<any> {
    try {
      // Step 1: Geocode zip code → lat/long
      const geoRes = await axios.get(this.geocodingUrl, {
        params: {
          name: zipCode,
          count: 1,
          language: 'en',
          format: 'json',
        },
      });

      const location = geoRes.data.results?.[0];
      if (!location) {
        throw new Error(`No location found for zip code ${zipCode}`);
      }

      // Step 2: Get weather using coordinates + forecast days
      const weatherRes = await axios.get(this.weatherUrl, {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,wind_direction_10m',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
          timezone: 'auto',
          forecast_days: forecastDays,
          temperature_unit: "fahrenheit",   // or "celsius"
          wind_speed_unit: "mph",           // or "kmh", "ms", "kn"
          precipitation_unit: "inch",       // or "mm"
        },
      });

      await this.logStore.create({
        severity: 'debug',
        message: `Retrieved weather for zip ${zipCode}`,
        metadata: { zipCode, city: location.name, forecastDays },
      });

      return {
        ...weatherRes.data,
        location: {
          name: location.name,
          admin1: location.admin1,
          country: location.country,
          zipCode,
        },
      };
    } catch (err: any) {
      await this.logStore.create({
        severity: 'error',
        message: `Failed to get weather for zip ${zipCode}`,
        metadata: { zipCode, error: err.message },
      });
      throw err;
    }
  }
}