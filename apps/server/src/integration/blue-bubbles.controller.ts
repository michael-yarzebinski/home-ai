// src/webhooks/bluebubbles.controller.ts
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { UsersService } from '../core/entities/user/user.service';
import { LogService } from '../core/entities/monitoring/log/log.serice';
import { AIOrchestratorService } from 'src/orchestrator/ai-orchestrator.service';
import { BlueBubblesService } from './blue-bubbles.service';
import { MessageRequest, MessageSource } from 'src/orchestrator/interfaces/message-request';

interface BlueBubblesWebhookPayload {
  guid: string;
  text: string;
  handle: string;           // sender's iMessage address
  chatGuid?: string;
  timestamp?: number;
}

@Controller('webhooks/bluebubbles')
export class BlueBubblesWebhookController {
  constructor(
    private readonly aiOrchestrator: AIOrchestratorService,
    private readonly blueBubblesService: BlueBubblesService,
    private readonly logService: LogService,
  ) {}

  @Post('incoming')
  @HttpCode(200)   // BlueBubbles expects a fast 200 OK
  async handleIncoming(@Body() payload: BlueBubblesWebhookPayload) {
      // Log the incoming message (audit trail)
      await this.logService.log({
        message: `Incoming iMessage from ${payload.handle}`,
        severity: 'info',
        data: {
          textPreview: payload.text.substring(0, 120),
          chatGuid: payload.chatGuid || payload.guid,
        },
      });

      // Build request for the orchestrator
      const messageRequest: MessageRequest = {
        userIdentifier: payload.handle,
        messageText: payload.text.trim(),
        chatGuid: payload.chatGuid || payload.guid,
        source: MessageSource.IMESSAGE,
      };

      const result = await this.aiOrchestrator.processMessage(messageRequest);

      await this.blueBubblesService.sendIMessage({
        guid: payload.chatGuid || payload.guid,
        text: result.response,
        handle: payload.handle,
      });

      return { status: 'processed', result: result.status };
  }
}