// core/stores/notification-log/notification-log.store.ts
import type { Knex } from 'knex';
import { AbstractMonitoringStore } from '../abstract/abstract-monitoring.store';
import type { SearchCriteria } from '@home-ai/shared/search/search';
import { Paginated } from '@home-ai/shared/search/pagination';
import type  { NotificationLog } from '@home-ai/shared/domain/notification-log/notification-log';
import { Inject, Injectable } from '@nestjs/common';

export interface NotificationLogRecord {
  id: string;
  user_id: string;
  message: string;
  created_at: Date;
}

@Injectable()
export class NotificationLogStore extends AbstractMonitoringStore<NotificationLog, NotificationLogRecord> {
  constructor(@Inject('KNEX_CONNECTION') knex: Knex,) {
    super(knex, { tableName: 'notification_log' });
  }

  async search(criteria: SearchCriteria): Promise<Paginated<NotificationLog>> {
    return {
      items: [],
      total: 0,
      page: criteria.page,
      pageSize: criteria.pageSize,
      hasNext: false,
      hasPrevious: false,
    };
  }

  protected recordToDomain(record: NotificationLogRecord): NotificationLog {
    return {
      id: record.id,
      userId: record.user_id,
      message: record.message,
      createdAt: record.created_at,
    };
  }

  protected domainToRecord(domain: NotificationLog): NotificationLogRecord {
    return {
      id: domain.id,
      user_id: domain.userId,
      message: domain.message,
      created_at: domain.createdAt,
    };
  }
}