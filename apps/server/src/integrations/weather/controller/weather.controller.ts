import { Body, Controller, NotFoundException, Post } from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { AuthUser } from "../../../core/auth/jwt.strategy";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { WeatherService } from "../service/weather.service";
import {
  WeatherRequestSchema,
  WeatherRequest,
} from "@home-ai/shared/domain/weather/weather-request";
import { AppConfigService } from "../../../core/services/app-config.service";

@Controller("v1/weather")
export class WeatherController {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly weatherService: WeatherService,
  ) {}

  @Post("get-weather")
  async getWeather(
    @Body(new ZodValidationPipe(WeatherRequestSchema)) payload: WeatherRequest,
    @CurrentUser() _authUser: AuthUser,
  ) {
    const zipCode = await this.appConfigService.getFromDb<string>("ZIP_CODE");
    if (!zipCode) {
      throw new NotFoundException(
        "Missing ZIP_CODE in app config. Please set it in the app config.",
      );
    }

    return this.weatherService.getWeather(zipCode, payload);
  }
}
