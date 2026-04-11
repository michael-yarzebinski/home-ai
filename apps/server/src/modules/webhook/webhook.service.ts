import { Injectable } from '@nestjs/common';
import { AiToolsService } from '../../tools/ai-tools.service';

@Injectable()
export class WebhookService {
  constructor(private readonly aiToolsService: AiToolsService) {}

  async handleDeviceEvent(payload: any) {
    const message = payload.message || 
      `${payload.device || 'Device'} - ${payload.event || 'unknown event'}`;

    // Process as automation user (no requester)
    return this.aiToolsService.processMessage(
      message,
      null,                    // automation source
      'webhook'
    );
  }
}