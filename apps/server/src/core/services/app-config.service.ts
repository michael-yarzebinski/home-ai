// src/core/services/app-config.service.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfigStore } from "../stores/app-config/app-config.store";
import { LogStore } from "../stores/monitoring/log/log.store";
import { ConfigNotFoundError } from "src/common/errors/config-not-found.error";
import { Trace } from "src/common/decorators/trace.decorator";
import {
  TIMEZONE_CONFIG_KEY,
  resolveTimezone,
} from "@home-ai/shared/common/timezone";

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: ConfigService,
    private readonly appConfigStore: AppConfigStore,
    private readonly logStore: LogStore,
  ) {}

  /**
   * Check database only (async).
   */
  @Trace()
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

  /** Server/household IANA timezone from `app_config`. Falls back to America/New_York. */
  @Trace()
  async getTimezone(): Promise<string> {
    const row = await this.appConfigStore.getByKey(TIMEZONE_CONFIG_KEY);
    const raw = row?.value;
    const value =
      typeof raw === "string" ? raw : raw != null ? String(raw) : undefined;
    return resolveTimezone(value);
  }
}
