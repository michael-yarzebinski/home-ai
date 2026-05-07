// core/stores/notification-log/notification-log.store.ts
import type { Knex } from "knex";
import { AbstractMonitoringStore } from "../abstract/abstract-monitoring.store";
import type { NotificationLog } from "@home-ai/shared/domain/notification-log/notification-log";
import { Inject, Injectable } from "@nestjs/common";

export interface NotificationLogRecord {
  id: string;
  user_id: string;
  message: string;
  created_at: Date;
}

@Injectable()
export class NotificationLogStore extends AbstractMonitoringStore<
  NotificationLog,
  NotificationLogRecord
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex) {
    super(knex, { tableName: "notification_log" });
  }

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    text: string,
  ): Knex.QueryBuilder {
    return query.whereILike("message", `%${text}%`);
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
