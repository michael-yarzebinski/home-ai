import { Module } from '@nestjs/common';

import { CoreModule } from 'src/core/core.module';
import { BlueBubblesService } from './blue-bubbles.service';

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
    CoreModule
  ],
  providers: [
    BlueBubblesService,
  ],
  exports: [BlueBubblesService],
})
export class IntegrationModule {}
