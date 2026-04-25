// src/core/stores/notification-queue/notification-queue.store.ts
import type { Knex } from 'knex';
import { AbstractEntityStore } from '../abstract/abstract-entity.store';
import type { NotificationQueue } from '@home-ai/shared/domain/notification-queue/notification-queue';
import type { SearchCriteria } from '@home-ai/shared/search/search';
import { Paginated } from '@home-ai/shared/search/pagination';
import { AuditStore } from '../audit/audit.store';
import { Inject, Injectable } from '@nestjs/common';

export interface NotificationQueueRecord {
  id: string;
  user_id: string;
  message: string;
  importance: string;
  scheduled_for: Date;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class NotificationQueueStore extends AbstractEntityStore<NotificationQueue, NotificationQueueRecord> {
  constructor(@Inject('KNEX_CONNECTION') knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: 'notification_queue', entityType: 'notification_queue' });
  }

  async search(criteria: SearchCriteria): Promise<Paginated<NotificationQueue>> {
    return {
      items: [],
      total: 0,
      page: criteria.page,
      pageSize: criteria.pageSize,
      hasNext: false,
      hasPrevious: false,
    };
  }

  protected recordToDomain(record: NotificationQueueRecord): NotificationQueue {
    return {
      id: record.id,
      userId: record.user_id,
      message: record.message,
      importance: record.importance,
      scheduledFor: record.scheduled_for,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: NotificationQueue): NotificationQueueRecord {
    return {
      id: domain.id,
      user_id: domain.userId,
      message: domain.message,
      importance: domain.importance,
      scheduled_for: domain.scheduledFor,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  async getDueNotifications(): Promise<NotificationQueue[]> {
    const now = new Date();

    const records = await this.active
      .where('scheduled_for', '<=', now)           // due now or in the past
      .orderBy('scheduled_for', 'asc')             // oldest first
      .select('*');

    return records.map(record => this.recordToDomain(record as NotificationQueueRecord));
  }
}