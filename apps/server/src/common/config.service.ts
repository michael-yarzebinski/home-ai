import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  /**
   * Get config value with type safety
   */
  get<T = any>(key: string): T | undefined {
    return this.configService.get<T>(key);
  }

  /**
   * Get config value with default fallback
   */
  getOrDefault<T = any>(key: string, defaultValue: T): T {
    const value = this.configService.get<T>(key);
    return value !== undefined ? value : defaultValue;
  }

  getDatabaseConfig() {
    return {
      host: this.getOrDefault<string>('DB_HOST', 'localhost'),
      port: this.getOrDefault<number>('DB_PORT', 5432),
      user: this.getOrDefault<string>('DB_USER', 'aiadmin'),
      password: this.getOrDefault<string>('DB_PASSWORD', 'aihome_secure_2026'),
      database: this.getOrDefault<string>('DB_NAME', 'aihome'),
    };
  }

  getServerPort(): number {
    return this.getOrDefault<number>('SERVER_PORT', 3000);
  }

  getWebhookSecret(): string {
    return this.getOrDefault<string>('WEBHOOK_SECRET', 'change_this_to_a_strong_secret_please');
  }

  getWeatherZipCode(): string {
    return this.getOrDefault<string>('WEATHER_ZIP_CODE', '90210');
  }
}