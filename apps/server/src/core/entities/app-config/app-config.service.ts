import { Injectable, Logger } from '@nestjs/common';
import { AppConfigStore } from './app-config.store';
import { AppConfig } from './app-config.domain';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);
  private readonly envCache = new Map<string, any>();

  constructor(private readonly appConfigStore: AppConfigStore) {
    this.loadEnvCache();
  }

  private loadEnvCache(): void {
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        this.envCache.set(key, value);
      }
    }
    this.logger.debug(`Cached ${this.envCache.size} environment variables from process.env`);
  }

  async setConfig(key: string, value: any, description?: string): Promise<AppConfig> {
    return this.appConfigStore.setValue(key, value, description);
  }

  async toggleConfig(key: string, active: boolean): Promise<void> {
    await this.appConfigStore.setActive(key, active);
  }

  getFromEnv<T = any>(key: string): T {
    if (!this.envCache.has(key)) {
      throw new Error(`Environment variable ${key} not found`);
    }

    const value = this.envCache.get(key);
    return value as T;
  }

  // ─────────────────────────────────────────────────────────────
  // Database Config Access
  // ─────────────────────────────────────────────────────────────

  async getFromDb<T = any>(key: string): Promise<T | undefined> {
    try {
      const config = await this.appConfigStore.getByKey(key);
      return undefined;
    } catch (error) {
      this.logger.warn(`DB lookup failed for config key=${key}`, error);
      return undefined;
    }
  }
}