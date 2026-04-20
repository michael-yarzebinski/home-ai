import { Inject, Injectable, Logger } from '@nestjs/common';
import { Knex } from 'knex';
import { AbstractEntityStore } from '../abstract-entity.store';
import { AuditService } from '../monitoring/audit/audit.service';
import { KNEX_CONNECTION } from '../../database/knex.constants';
import { AppConfig } from './app-config.domain';

export interface AppConfigRecord {
  id: string;
  key: string;
  value: any;                    // jsonb
  description?: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
@Injectable()
export class AppConfigStore extends AbstractEntityStore<AppConfigRecord, AppConfig> {
  private readonly logger = new Logger(AppConfigStore.name);

  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
  ) {
    super(knex, auditService, {
      tableName: 'app_config',
      auditEntityType: 'AppConfig',
      hasUpdatedAt: true,
      hasActiveFlag: true,
    });
  }

  protected domainToRecord(domain: Partial<AppConfig>): Partial<AppConfigRecord> {
    return {
      id: domain.id,
      key: domain.key,
      value: domain.value ?? {},
      description: domain.description,
      active: domain.active ?? true,
    };
  }

  protected recordToDomain(record: AppConfigRecord): AppConfig {
    return {
      id: record.id,
      key: record.key,
      value: record.value ?? {},
      description: record.description ?? undefined,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected searchQuery(search: string, query: Knex.QueryBuilder<AppConfigRecord>): Knex.QueryBuilder<AppConfigRecord> {
    const escaped = search.trim().replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    return query.andWhereRaw(`key ILIKE ? ESCAPE '\\'`, [`%${escaped}%`]);
  }

  async getByKey(key: string, includeInactive = false): Promise<AppConfig | null> {
    let query = this.baseQuery().where('key', key);

    if (!includeInactive) {
      query = query.where('active', true);
    }

    const record = await query.first();
    return record ? this.recordToDomain(record) : null;
  }

}