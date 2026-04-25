// src/core/stores/notification-preference/notification-preference.store.ts
import type { Knex } from "knex";
import { AbstractEntityStore } from "../abstract/abstract-entity.store";
import type { NotificationPreference } from "@home-ai/shared/domain/notification-preference/notification-preference";
import type { SearchCriteria } from "@home-ai/shared/search/search";
import { Paginated } from "@home-ai/shared/search/pagination";
import { AuditStore } from "../audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";

export interface NotificationPreferenceRecord {
  id: string;
  user_id: string;
  trigger_type: string;
  trigger_config: any;
  message_template: string;
  importance: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class NotificationPreferenceStore extends AbstractEntityStore<
  NotificationPreference,
  NotificationPreferenceRecord
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, {
      tableName: "notification_preferences",
      entityType: "notification_preferences",
    });
  }

  async search(
    criteria: SearchCriteria,
  ): Promise<Paginated<NotificationPreference>> {
    return {
      items: [],
      total: 0,
      page: criteria.page,
      pageSize: criteria.pageSize,
      hasNext: false,
      hasPrevious: false,
    };
  }

  protected recordToDomain(
    record: NotificationPreferenceRecord,
  ): NotificationPreference {
    return {
      id: record.id,
      userId: record.user_id,
      triggerType: record.trigger_type,
      triggerConfig: record.trigger_config,
      messageTemplate: record.message_template,
      importance: record.importance,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(
    domain: NotificationPreference,
  ): NotificationPreferenceRecord {
    return {
      id: domain.id,
      user_id: domain.userId,
      trigger_type: domain.triggerType,
      trigger_config: domain.triggerConfig,
      message_template: domain.messageTemplate,
      importance: domain.importance,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  async getByUserId(userId: string): Promise<NotificationPreference[]> {
    const records = await this.active.where("user_id", userId);

    return records.map((r) => this.recordToDomain(r));
  }

  async getForTool(
    userId?: string,
    triggerType?: string,
  ): Promise<NotificationPreference[]> {
    let query = this.active;
    if (userId) {
      query = query.where("user_id", userId);
    }
    if (triggerType) {
      query = query.where("trigger_type", triggerType);
    }

    const records = await query;

    return records.map((r) => this.recordToDomain(r));
  }
}
