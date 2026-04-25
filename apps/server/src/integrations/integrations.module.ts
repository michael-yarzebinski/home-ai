// src/integrations/integrations.module.ts
import { Module } from "@nestjs/common";
import { CoreModule } from "../core/core.module";
import { AIModule } from "../ai/ai.module";

// Services
import { BlueBubblesService } from "./blue-bubbles/blue-bubbles.service";
import { HomeAssistantService } from "./home-assistant/home-assistant.service";

// Controllers
import { BlueBubblesController } from "./blue-bubbles/blue-bubbles.controller";
import { WeatherService } from "./weather/weather.service";

@Module({
  imports: [CoreModule, AIModule],
  controllers: [BlueBubblesController],
  providers: [BlueBubblesService, HomeAssistantService, WeatherService],
  exports: [BlueBubblesService, HomeAssistantService, WeatherService],
})
export class IntegrationsModule {}
