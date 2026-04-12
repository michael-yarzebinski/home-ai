import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from '../audit/audit.service';
import { AbstractEntityStore } from '../abstract-entity.store';
import { EntityStoreOptions, KNEX_CONNECTION } from '../database/knex.constants';
import { Config } from './config.domain';

/**
 * Database record shape for the 'config' table (snake_case, matches schema exactly).
 * Only includes columns that exist in the migration.
 */
export interface ConfigRecord {
  key: string;
  value: string | null;
  description: string | null;
  updated_at: Date | null;
}

@Injectable()
export class ConfigStore extends AbstractEntityStore<ConfigRecord, Config> {
  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
  ) {
    super(knex, auditService, {
      tableName: 'config',
      auditEntityType: 'Config',
      primaryKey: 'key',
      hasUpdatedAt: true,
    });
  }

  /**
   * Map domain (camelCase) to DB record (snake_case).
   * Conservative: only maps fields that exist in schema.
   */
  protected domainToRecord(domain: Partial<Config>): Partial<ConfigRecord> {
    const record: Partial<ConfigRecord> = {};

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
  protected recordToDomain(record: ConfigRecord): Config {
    return {
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
  async getByKey(key: string): Promise<Config | null> {
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
  async upsert(key: string, value: string, description?: string): Promise<Config> {
    const existing = await this.getByKey(key);

    if (existing) {
      return this.update(key, { value, description });
    } else {
      return this.create({ key, value, description });
    }
  }
}
