import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from '../audit/audit.service';
import { AbstractEntityStore } from '../abstract-entity.store';
import { KNEX_CONNECTION } from '../database/knex.constants';
import { AppConfig } from './app-config.domain';

/**
 * Database record shape for the 'config' table (snake_case, matches schema exactly).
 * Only includes columns that exist in the migration.
 */
export interface AppConfigRecord {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  updated_at: Date | null;
}

@Injectable()
export class ConfigStore extends AbstractEntityStore<AppConfigRecord, AppConfig> {
  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
  ) {
    super(knex, auditService, {
      tableName: 'app_config',
      auditEntityType: 'AppConfig',
      primaryKey: 'id',
      hasUpdatedAt: true,
    });
  }

  /**
   * Map domain (camelCase) to DB record (snake_case).
   * Conservative: only maps fields that exist in schema.
   */
  protected domainToRecord(domain: Partial<AppConfig>): Partial<AppConfigRecord> {
    const record: Partial<AppConfigRecord> = {};

    if (domain.key !== undefined) record.key = domain.key;
    if (domain.value !== undefined) record.value = domain.value;
    if (domain.description !== undefined) record.description = domain.description ?? null;
    // updated_at is managed by DB trigger/default

    return record;
  }

  /**
   * Map DB record (snake_case) to domain (camelCase).
   * Preserves all schema fields without inventing new ones.
   */
  protected recordToDomain(record: AppConfigRecord): AppConfig {
    return {
      id: record.id,
      key: record.key,
      value: record.value,
      description: record.description || undefined,
      updatedAt: record.updated_at || undefined,
    };
  }

  /**
   * Specialized method for config: get by key (most common use case).
   * Delegates to generic findOneBy for consistency.
   */
  async getByKey(key: string): Promise<AppConfig | null> {
    return this.findOneBy({ key });
  }

  /**
   * Get value by key with optional default (useful for config patterns).
   */
  async getValue(key: string, defaultValue?: string): Promise<string | null> {
    const config = await this.getByKey(key);
    return config?.value ?? defaultValue ?? null;
  }

  /**
   * Upsert pattern common for config (insert or update by key).
   */
  async upsert(key: string, value: string, description?: string): Promise<AppConfig> {
    const existing = await this.getByKey(key);

    if (existing) {
      return this.update(key, { value, description });
    } else {
      return this.create({ key, value, description });
    }
  }
}
