import { Inject, Injectable, Logger } from '@nestjs/common';
import { Knex } from 'knex';
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
export class AppConfigStore {
  private readonly logger = new Logger(AppConfigStore.name);

  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
  ) {}

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

  async getByKey(key: string, includeInactive = false): Promise<AppConfig | null> {
    let query = this.knex<AppConfigRecord>('app_config').where('key', key);

    if (!includeInactive) {
      query = query.where('active', true);
    }

    const record = await query.first();
    return record ? this.recordToDomain(record) : null;
  }

  async getValue<T = any>(key: string, defaultValue?: T): Promise<T> {
    const config = await this.getByKey(key);
    return (config?.value as T) ?? defaultValue ?? ({} as T);
  }

  async setValue(key: string, value: any, description?: string): Promise<AppConfig> {
    const existing = await this.getByKey(key, true);

    if (existing) {
      const updated = await this.knex('app_config')
        .where('key', key)
        .update({
          value,
          description: description ?? existing.description,
          updated_at: this.knex.fn.now(),
        })
        .returning('*');

      return this.recordToDomain(updated[0]);
    }

    // Create new
    const newRecord = this.domainToRecord({
      key,
      value,
      description,
      active: true,
    });

    const [created] = await this.knex('app_config').insert(newRecord).returning('*');
    return this.recordToDomain(created);
  }

  async setActive(key: string, active: boolean): Promise<void> {
    await this.knex('app_config').where('key', key).update({
      active,
      updated_at: this.knex.fn.now(),
    });
  }
}