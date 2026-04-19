// src/core/bluebubbles/bluebubbles.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from 'src/core/entities/app-config/app-config.service';
import { LogService } from 'src/core/entities/monitoring/log/log.serice';

interface BlueBubblesMessage {
  guid?: string;
  text: string;
  handle: string;        // iMessage address (email or phone)
}

@Injectable()
export class BlueBubblesService {
  private readonly baseUrl: string;
  private readonly password: string;

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly logService: LogService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.appConfigService.getFromEnv<string>('BLUEBUBBLES_URL') || 'http://localhost:1234';
    this.password = this.appConfigService.getFromEnv<string>('BLUEBUBBLES_PASSWORD') || '';
  }

  async sendIMessage(message: BlueBubblesMessage): Promise<void> {
    if (!this.password) {
      await this.logService.log({
        message: 'BlueBubbles password missing',
        severity: 'error',
      });

      return;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/api/v1/message`,
          {
            message: message.text,
            handle: message.handle,
            ...(message.guid && { guid: message.guid }),
          },
          {
            headers: {
              Authorization: `Bearer ${this.password}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      const guid = response.data?.guid;
      await this.logService.log({
        message: 'iMessage sent via BlueBubbles',
        severity: 'info',
        data: { guid, handle: message.handle, textPreview: message.text.substring(0, 100) },
      });

    } catch (error: any) {
      await this.logService.log({
        message: 'BlueBubbles send failed',
        severity: 'error',
        data: { error: error.message, status: error.response?.status },
      });
    }
  }
}