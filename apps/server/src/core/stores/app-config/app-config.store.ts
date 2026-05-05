// core/stores/app-config/app-config.store.ts
import type { Knex } from 'knex';
import type { AppConfig, InsertableAppConfig, UpdatableAppConfig } from '@home-ai/shared/domain/app-config/app-config';
import { AbstractEntityStore } from '../abstract/abstract-entity.store';
import { AuditStore } from '../audit/audit.store';
import { Inject, Injectable } from '@nestjs/common';

export interface AppConfigRecord {
  id: string;
  key: string;
  value: any;
  description?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class AppConfigStore extends AbstractEntityStore<AppConfig, AppConfigRecord, InsertableAppConfig, UpdatableAppConfig> {
  constructor(@Inject('KNEX_CONNECTION') knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: 'app_config', entityType: 'app_config' });
  }

  protected validateForRead(query: Knex.QueryBuilder): Knex.QueryBuilder {
    return query; // Admin-only — role enforced at route level.
  }

  protected validateForWrite(query: Knex.QueryBuilder): Knex.QueryBuilder {
    return query;
  }

  protected applyTextSearch(query: Knex.QueryBuilder, search: string): Knex.QueryBuilder {
    const like = `%${search.toLowerCase()}%`;
    return query.where((b) =>
      b.whereILike('key', like).orWhereILike('description', like),
    );
  }

  protected recordToDomain(record: AppConfigRecord): AppConfig {
    return {
      id: record.id,
      key: record.key,
      value: record.value,
      description: record.description,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: AppConfig): AppConfigRecord {
    return {
      id: domain.id,
      key: domain.key,
      value: domain.value,
      description: domain.description,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  async getByKey(key: string) : Promise<AppConfig | undefined> {
    const record = await this.active.where('key', key).first();
    return record ? this.recordToDomain(record) : record;
  }
}