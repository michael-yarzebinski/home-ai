// src/core/stores/notification-queue/notification-queue.store.ts
import type { Knex } from "knex";

import { AbstractEntityStore } from "../abstract/abstract-entity.store";
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
    return query.whereILike("message", like);
  }

  protected recordToDomain(record: NotificationQueueRecord): NotificationQueue {
    return {
      id: record.id,
      userId: record.user_id,
      message: record.message,
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
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  async getPendingNotifications(): Promise<NotificationQueue[]> {
    const records = await this.active.orderBy("created_at", "asc").select("*");

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
