import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { ConfigService } from '@nestjs/config';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Post('device-event')
  @HttpCode(HttpStatus.OK)
  async handleDeviceEvent(@Body() payload: any) {
    const secret = this.configService.get<string>('WEBHOOK_SECRET');

    if (payload.secret !== secret) {
      throw new BadRequestException('Invalid webhook secret');
    }

    try {
      const result = await this.webhookService.handleDeviceEvent(payload);
      return {
        success: true,
        message: 'Device event processed',
        result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to process device event',
        error: error.message,
      };
    }
  }
}