import { Module } from '@nestjs/common';

import { CoreModule } from 'src/core/core.module';

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
  exports: [],
})
export class IntegrationModule {}
