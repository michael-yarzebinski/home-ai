// core/stores/app-config/app-config.store.ts
import type { Knex } from 'knex';
import { AbstractMonitoringStore } from '../abstract/abstract-monitoring.store';
import type { AppConfig } from '@home-ai/shared/domain/app-config/app-config';
import type { SearchCriteria } from '@home-ai/shared/search/search';
import { Paginated } from '@home-ai/shared/search/pagination';
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
export class AppConfigStore extends AbstractEntityStore<AppConfig, AppConfigRecord> {
  constructor(@Inject('KNEX_CONNECTION') knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: 'app_config', entityType: 'app_config' });
  }

  async search(criteria: SearchCriteria): Promise<Paginated<AppConfig>> {
    // Basic implementation — expand as needed
    return {
      items: [],
      total: 0,
      page: criteria.page,
      pageSize: criteria.pageSize,
      hasNext: false,
      hasPrevious: false,
    };
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