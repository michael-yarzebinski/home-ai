import { Module } from '@nestjs/common';

import { CoreModule } from 'src/core/core.module';
import { BlueBubblesService } from './blue-bubbles.service';
import { BackgroundNotificationService } from './background-notification.service';
import { HttpModule } from '@nestjs/axios';

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
  providers: [
    BlueBubblesService,
    BackgroundNotificationService,
  ],
  exports: [BlueBubblesService],
})
export class IntegrationModule {}
