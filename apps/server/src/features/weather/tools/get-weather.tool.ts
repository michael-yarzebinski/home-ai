import { Injectable } from "@nestjs/common";
import { AppConfigService } from "src/core/services/app-config.service";
import { WeatherService } from "src/integrations/weather/service/weather.service";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { Tool } from "src/tools/decorators/tool.decorator";
import { ToolContext } from "src/tools/types/tool-context";
import { z } from "zod";
import {
  WeatherTimePeriod,
  WeatherRequest,
} from "@home-ai/shared/domain/weather/weather-request";

const GetWeatherToolSchema = z.object({
  timePeriod: z
    .enum(WeatherTimePeriod)
    .optional()
    .default(WeatherTimePeriod.CURRENT),
  forecastDays: z.preprocess((value) => {
    if (typeof value === "string") {
      const parsed = Number(value.trim());
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  }, z.number().int().min(1).max(7).optional().default(2).describe("Number of days of forecast to include (1-7). Optional; defaults to 2.")),
});

export interface GetWeatherResult {
  success: boolean;
  weather?: any;
  message: string;
}

@Tool()
@Injectable()
export class GetWeatherTool extends ToolHandler<
  typeof GetWeatherToolSchema,
  GetWeatherResult
> {
  readonly name = "get-weather";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Get current weather and short forecast using the configured ZIP_CODE from app config. " +
    "Use this tool when the user asks about the weather.";

  readonly parameters = GetWeatherToolSchema;

  constructor(
    private readonly weatherService: WeatherService,
    private readonly appConfigService: AppConfigService,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof GetWeatherToolSchema>,
    _context: ToolContext,
  ): Promise<GetWeatherResult> {
    const zipCode = await this.appConfigService.getFromDb<string>("ZIP_CODE");
    const weatherRequest: WeatherRequest = {
      timePeriod: params.timePeriod,
      days: params.forecastDays,
    };

    if (!zipCode) {
      return {
        success: false,
        message: `Zipcode not configured in app config.`,
      };
    }

    const weather = await this.weatherService.getWeather(
      zipCode,
      weatherRequest,
    );

    return {
      success: true,
      weather,
      message: `Weather for ${zipCode} retrieved (${weatherRequest.days} day forecast).`,
    };
  }
}
