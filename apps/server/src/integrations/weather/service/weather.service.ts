import { Injectable } from "@nestjs/common";
import { LogStore } from "../../../core/stores/monitoring/log/log.store";
import { Trace } from "../../../common/decorators/trace.decorator";
import axios from "axios";
import {
  WeatherRequest,
  WeatherTimePeriod,
} from "@home-ai/shared/domain/weather/weather-request";

@Injectable()
export class WeatherService {
  private readonly geocodingUrl =
    "https://geocoding-api.open-meteo.com/v1/search";
  private readonly weatherUrl = "https://api.open-meteo.com/v1/forecast";

  constructor(private readonly logStore: LogStore) {}

  @Trace()
  async getWeather(
    zipCode: string,
    weatherRequest: WeatherRequest,
  ): Promise<any> {
    // Step 1: Geocode zip code → lat/long
    const geoRes = await axios.get(this.geocodingUrl, {
      params: {
        name: zipCode,
        count: 1,
        language: "en",
        format: "json",
      },
    });

    const location = geoRes.data.results?.[0];
    if (!location) {
      throw new Error(`No location found for zip code ${zipCode}`);
    }

    const params: any = {
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: "auto",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      precipitation_unit: "inch",
      forecast_days: weatherRequest.days,
    };

    if (weatherRequest.timePeriod === WeatherTimePeriod.CURRENT) {
      params.current =
        "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,wind_direction_10m";
      params.forecast_days = weatherRequest.days ?? 1;
    } else if (weatherRequest.timePeriod === WeatherTimePeriod.HOURLY) {
      params.hourly =
        "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,is_day";
      params.forecast_days = weatherRequest.days ?? 1;
    } else if (weatherRequest.timePeriod === WeatherTimePeriod.DAILY) {
      params.daily =
        "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum";
    }

    // Step 2: Get weather using coordinates + forecast days
    const weatherRes = await axios.get(this.weatherUrl, {
      params,
    });

    await this.logStore.create({
      severity: "debug",
      message: `Retrieved weather for zip ${zipCode}`,
      metadata: { zipCode, city: location.name, weatherRequest },
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
  }
}
