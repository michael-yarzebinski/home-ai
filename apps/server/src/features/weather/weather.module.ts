import { Module } from "@nestjs/common";
import { CoreModule } from "src/core/core.module";
import { IntegrationsModule } from "src/integrations/integrations.module";
import { GetWeatherTool } from "./tools/get-weather.tool";

@Module({
  imports: [CoreModule, IntegrationsModule],
  providers: [GetWeatherTool],
  exports: [GetWeatherTool],
})
export class WeatherModule {}
