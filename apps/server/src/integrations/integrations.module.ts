// src/integrations/integrations.module.ts
import { Module } from "@nestjs/common";
import { CoreModule } from "../core/core.module";
import { AIModule } from "../ai/ai.module";
import { HttpModule } from "@nestjs/axios";

import { HomeAssistantService } from "./home-assistant/services/home-assistant.service";
import { HomeAssistantController } from "./home-assistant/controller/home-assistant.controller";
import { WeatherService } from "./weather/service/weather.service";
import { RelayService } from "./relay/relay.service";
import { HomeAssistantProcessor } from "./home-assistant/services/home-assistant-processor.service";
import { BlueBubblesController } from "./blue-bubbles/blue-bubbles.controller";
import { BlueBubblesService } from "./blue-bubbles/blue-bubbles.service";
import { NotificationService } from "./notification/notification.service";

@Module({
  imports: [CoreModule, AIModule, HttpModule],
  controllers: [HomeAssistantController, BlueBubblesController],
  providers: [
    HomeAssistantService,
    HomeAssistantProcessor,
    RelayService,
    WeatherService,
    BlueBubblesService,
    NotificationService,
  ],
  exports: [
    HomeAssistantService,
    RelayService,
    WeatherService,
    BlueBubblesService,
    NotificationService,
  ],
})
export class IntegrationsModule {}
