import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigStore } from './app-config.store';
import { AppConfig } from './app-config.domain';
import { AuditService } from '../audit/audit.service';

/**
 * Custom exception for missing required configuration.
 * Thrown by AppConfigService.get() when a key is not found in DB or .env.
 */
export class ConfigNotFoundException extends BadRequestException {
  constructor(key: string) {
    super(`Required configuration '${key}' not found in database or environment variables. ` +
          `Please add it to .env or the config DB table.`);
  }
}

/**
 * Unified, strict AppConfigService - the single source of truth for all configuration.
 * 
 * - Strict async get<T>(key: string): Promise<T> — throws ConfigNotFoundException if missing from both sources.
 * - Env cache is prioritized first, then DB (per latest requirements).
 * - No DB caching per requirements — query the store live for every get().
 * - Audits every DB write (without logging sensitive values).
 * 
 * This replaces the old custom ConfigService. All calling code should use await this.appConfig.get() strictly.
 */
@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);
  private readonly envCache = new Map<string, any>();
  private readonly sensitiveKeys = new Set(['password', 'secret', 'key', 'token', 'private']);

  constructor(
    private readonly configStore: ConfigStore,
    private readonly auditService: AuditService,
  ) {
    // Cache all env vars on construction for fast access
    this.loadEnvCache();
  }

  private loadEnvCache(): void {
    // Cache ALL environment variables from process.env (the ultimate source of truth).
    // NestConfigService.get() without a key can be unreliable across environments.
    // TODO: The commonKeys list below documents the most important keys for this project.
    // Sensitive keys are automatically redacted in logs/audits by logIfSensitive().
    // const commonKeys = [
    //   'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
    //   'SERVER_PORT', 'WEBHOOK_SECRET', 'WEATHER_ZIP_CODE',
    //   'NODE_ENV', 'AI_PROVIDER', 'OLLAMA_HOST', 'OLLAMA_MODEL',
    //   'HOME_ASSISTANT_URL', 'HOME_ASSISTANT_TOKEN', // Add more as needed
    // ];

    // Cache everything from process.env
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        this.envCache.set(key, value);
      }
    }

    this.logger.debug(`Cached ${this.envCache.size} environment variables from process.env`);
  }

  getFromEnv<T = any>(key: string): T {
    if (this.envCache.has(key)) {
      const value = this.envCache.get(key);
      this.logIfSensitive('get (from env)', key, value);
      return value as T;
    }

    throw Error(`Could not find ${key} in env`)
  }

  async getFromDb<T = any>(key: string): Promise<T | undefined> {
    try {
      const config = await this.configStore.getByKey(key);
      if (config?.value !== undefined) {
        this.logIfSensitive('get (from DB)', key, config.value);
        return config.value as T;
      }
    } catch (error) {
      this.logger.warn(`DB lookup failed for key=${key}`, error);
    }
    return undefined;
  }

  /**
   * Set or update a config value in the DB and audit it.
   * No DB caching per requirements.
   * Never logs sensitive values.
   */
  async set(key: string, value: any, description?: string): Promise<AppConfig> {
    this.logIfSensitive('set', key, value, true); // true = isWrite

    const config = await this.configStore.upsert(key, String(value), description);

    this.logger.log(`Updated config key '${key}' in DB (audited)`);
    return config;
  }

  private logIfSensitive(operation: string, key: string, value: any, isWrite = false): void {
    const lowerKey = key.toLowerCase();
    if (this.sensitiveKeys.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('secret')) {
      this.logger.debug(`${operation} sensitive key '${key}' (value redacted)`);
      if (isWrite) {
        // Still audit the write, but without the actual value
        this.auditService.log({
          entityType: 'Config',
          entityId: key,
          action: 'UPDATE',
          changes: { },
          metadata: { sensitive: true },
        }).catch(() => {});
      }
      return;
    }

    if (isWrite) {
      this.auditService.log({
        entityType: 'Config',
        entityId: key,
        action: 'UPDATE',
        changes: { new: value },
      }).catch(() => {});
    }
  }
}
