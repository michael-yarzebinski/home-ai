import { Module } from '@nestjs/common';

import { CoreModule } from 'src/core/core.module';
import { BlueBubblesService } from './blue-bubbles.service';
import { BackgroundNotificationService } from './background-notification.service';
import { HttpModule } from '@nestjs/axios';
import { HomeAssistantService } from './home-assistant/home-assistant.service';
import { HomeAssistantAdminController } from './home-assistant/home-assistant-admin.controller';

/**
 * IntegrationModule - Handles all incoming integrations (webhook, iMessage input, etc.).
 * 
 * Contains:
 * - WebhookController
 * - iMessage input handling
 * - Chat integration
 * 
 * Flow: Incoming events → ToolsModule (AIToolsService) → DomainModule → NotificationModule
 */
@Module({
  imports: [
    CoreModule, HttpModule,
  ],
  controllers: [HomeAssistantAdminController],
  providers: [
    HomeAssistantService,
    BlueBubblesService,
    BackgroundNotificationService,
  ],
  exports: [HomeAssistantService, BlueBubblesService],
})
export class IntegrationModule {}
