// src/core/services/app-config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigStore } from '../stores/app-config/app-config.store';
import { ConfigNotFoundError } from 'src/common/errors/config-not-found.error';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: ConfigService,
    private readonly appConfigStore: AppConfigStore,
  ) {}

  /**
   * Check database only (async).
   */
  async getFromDb<T = any>(key: string): Promise<T | undefined> {
    const dbConfigValue = await this.appConfigStore.getByKey(key);
    if (!dbConfigValue) {
        throw new ConfigNotFoundError(key);
    }

    return dbConfigValue.value as T;
  }

  /**
   * Check environment variables only (synchronous).
   * Safe to call from constructors.
   */
  getFromEnv<T = any>(key: string): T {
    const envConfigValue = this.configService.get<T>(key);
    if (!envConfigValue) {
        throw new ConfigNotFoundError(key);
    }

    return envConfigValue;
  }
}