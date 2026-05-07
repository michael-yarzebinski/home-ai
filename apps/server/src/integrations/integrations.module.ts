// src/integrations/integrations.module.ts
import { Module } from "@nestjs/common";
import { CoreModule } from "../core/core.module";
import { AIModule } from "../ai/ai.module";

// Services
import { BlueBubblesService } from "./blue-bubbles/blue-bubbles.service";
import { HomeAssistantService } from "./home-assistant/services/home-assistant.service";

// Controllers
import { BlueBubblesController } from "./blue-bubbles/blue-bubbles.controller";
import { WeatherService } from "./weather/service/weather.service";
import { RelayService } from "./relay/relay.service";
import { HttpModule } from "@nestjs/axios";
import { HomeAssistantProcessor } from "./home-assistant/services/home-assistant-processor.service";

@Module({
  imports: [CoreModule, AIModule, HttpModule],
  controllers: [BlueBubblesController],
  providers: [
    BlueBubblesService,
    HomeAssistantService,
    HomeAssistantProcessor,
    RelayService,
    WeatherService,
  ],
  exports: [
    BlueBubblesService,
    HomeAssistantService,
    RelayService,
    WeatherService,
  ],
})
export class IntegrationsModule {}
