// src/core/stores/notification-queue/notification-queue.store.ts
import type { Knex } from "knex";

import {
  AbstractEntityStore,
} from "../abstract/abstract-entity.store";
import type {
  NotificationQueue,
  InsertableNotificationQueue,
  UpdatableNotificationQueue,
} from "@home-ai/shared/domain/notification-queue/notification-queue";
import { AuditStore } from "../monitoring/audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";
import { AuthUser } from "../../auth/jwt.strategy";

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

  protected validateUserForRead(
    query: Knex.QueryBuilder,
    user: AuthUser,
  ): Knex.QueryBuilder {
    return query.where("user_id", user.id);
  }

  protected validateUserForWrite(
    query: Knex.QueryBuilder,
    user: AuthUser,
  ): Knex.QueryBuilder {
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

  override async create(
    dto: InsertableNotificationQueue,
    user?: AuthUser,
  ): Promise<NotificationQueue> {
    const record = this.domainToRecord(dto as any);
    const [inserted] = (await this.table
      .insert(record as any)
      .returning("*")) as NotificationQueueRecord[];
    const domain = this.recordToDomain(inserted);

    await this.auditStore.create({
      entityType: this.entityType,
      entityId: domain.id,
      action: "create",
      userId: user?.id,
      changes: { old: null, new: inserted },
    });

    return domain;
  }

  async markAsSent(id: string): Promise<void> {
    await this.table.where("id", id).update({ active: false });
    await this.auditStore.create({
      entityType: this.entityType,
      entityId: id,
      action: "mark_as_sent",
      changes: { old: null, new: { active: false } },
    });
  }
}
