import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { ConfigService } from '@nestjs/config';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Post('device-event')
  @HttpCode(HttpStatus.ACCEPTED)
  async handleDeviceEvent(@Body() payload: any) {
    const secret = this.configService.get<string>('WEBHOOK_SECRET');

    if (payload.secret !== secret) {
      throw new BadRequestException('Invalid webhook secret');
    }

    try {
      await this.webhookService.handleDeviceEvent(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Device webhook processing failed: ${msg}`, err instanceof Error ? err.stack : undefined);
    }

    return { accepted: true };
  }

  @Post('imessage')
  @HttpCode(HttpStatus.ACCEPTED)
  async handleIMessage(@Body() payload: any) {
    try {
      await this.webhookService.handleBlueBubblesMessage(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`iMessage webhook processing failed: ${msg}`, err instanceof Error ? err.stack : undefined);
    }

    return { accepted: true };
  }
}
