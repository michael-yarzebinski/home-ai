// src/core/stores/notification-queue/notification-queue.store.ts
import type { Knex } from "knex";

import {
  AbstractEntityStore,
  type RequestUser,
} from "../abstract/abstract-entity.store";
import type {
  NotificationQueue,
  InsertableNotificationQueue,
  UpdatableNotificationQueue,
} from "@home-ai/shared/domain/notification-queue/notification-queue";
import { AuditStore } from "../monitoring/audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";

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
export class NotificationQueueStore extends AbstractEntityStore<
  NotificationQueue,
  NotificationQueueRecord,
  InsertableNotificationQueue,
  UpdatableNotificationQueue
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, {
      tableName: "notification_queue",
      entityType: "notification_queue",
    });
  }

  protected validateForRead(
    query: Knex.QueryBuilder,
    user?: RequestUser,
  ): Knex.QueryBuilder {
    if (!user) return query; // Admin sees all.
    return query.where("user_id", user.id);
  }

  protected validateForWrite(
    query: Knex.QueryBuilder,
    user?: RequestUser,
  ): Knex.QueryBuilder {
    if (!user) return query;
    return query.where("user_id", user.id);
  }

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    search: string,
  ): Knex.QueryBuilder {
    const like = `%${search.toLowerCase()}%`;
    return query.where((b) =>
      b.whereILike("message", like).orWhereILike("importance", like),
    );
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
      .where("scheduled_for", "<=", now) // due now or in the past
      .orderBy("scheduled_for", "asc") // oldest first
      .select("*");

    return records.map((record) =>
      this.recordToDomain(record as NotificationQueueRecord),
    );
  }
}
