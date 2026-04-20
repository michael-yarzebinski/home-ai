import { SearchRequestDto, SearchUtils } from '@home-ai/shared';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AppConfigStore } from './app-config.store';
import { AppConfig } from './app-config.domain';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);
  private readonly envCache = new Map<string, any>();

  constructor(private readonly appConfigStore: AppConfigStore) {
    this.loadEnvCache();
  }

  reader(): Pick<AppConfigStore , 'getAll' | 'search' | 'getByKey'> {
    return this.appConfigStore;
  }

  private loadEnvCache(): void {
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        this.envCache.set(key, value);
      }
    }
    this.logger.debug(`Cached ${this.envCache.size} environment variables from process.env`);
  }

  async toggleConfig(key: string, active: boolean): Promise<AppConfig> {
    const config = await this.appConfigStore.getByKey(key);
    if (!config) {
      throw new BadRequestException(`Could not find config by key ${key}`);
    }
    return await this.appConfigStore.update(config.id, {active});
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
      return config?.value as T | undefined;
    } catch (error) {
      this.logger.warn(`DB lookup failed for config key=${key}`, error);
      return undefined;
    }
  }

  async search(
    criteria: SearchRequestDto,
  ): Promise<{ configs: AppConfig[]; total: number; page?: number; pageSize?: number }> {
    const { skip, take } = SearchUtils.toSkipTake(criteria);
    const result = await this.appConfigStore.search(
      criteria.search,
      skip,
      take,
      criteria.includeInactive,
    );
    return {
      configs: result.data,
      total: result.total,
      page: criteria.pageNumber,
      pageSize: criteria.pageSize,
    };
  }
}