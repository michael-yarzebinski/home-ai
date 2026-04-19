import { Injectable, Inject } from "@nestjs/common";
import { Knex } from "knex";
import { AbstractEntityStore } from "../abstract-entity.store";
import { AuditService } from "../monitoring/audit/audit.service";
import { KNEX_CONNECTION } from "../../database/knex.constants";
import { Notification } from "./notification.domain";


export interface NotificationRecord {
    id: string;
    recipient_user_id?: string | null;
    task_request_id?: string | null;
    message_text: string;
    status: string;
    scheduled_send_after?: Date | null;
    sent_at?: Date | null;
    notes?: string | null;
    created_at: Date;
    updated_at: Date;
  }

  // src/notifications/notification.store.ts
@Injectable()
export class NotificationStore extends AbstractEntityStore<NotificationRecord, Notification> {
  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
  ) {
    super(knex, auditService, {
      tableName: 'notifications',
      auditEntityType: 'Notification',
      primaryKey: 'id',
      hasUpdatedAt: true,
      hasActiveFlag: false,
    });
  }

  protected domainToRecord(domain: Partial<Notification>): Partial<NotificationRecord> {
    return {
      id: domain.id,
      recipient_user_id: domain.recipientUserId,
      task_request_id: domain.taskRequestId,
      message_text: domain.messageText,
      status: domain.status,
      scheduled_send_after: domain.scheduledSendAfter,
      sent_at: domain.sentAt,
      notes: domain.notes,
    };
  }

  protected recordToDomain(record: NotificationRecord): Notification {
    return {
      id: record.id,
      recipientUserId: record.recipient_user_id ?? undefined,
      taskRequestId: record.task_request_id ?? undefined,
      messageText: record.message_text,
      status: record.status,
      scheduledSendAfter: record.scheduled_send_after ?? undefined,
      sentAt: record.sent_at ?? undefined,
      notes: record.notes ?? undefined,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  /** Notifications held for quiet hours that are due to be sent (scheduled time has passed). */
  async findQueuedQuietHoursDue(asOf: Date): Promise<Notification[]> {
    const notifications = await this.knex<NotificationRecord>(this.tableName)
      .where('status', 'queued_quiet_hours')
      .whereNotNull('recipient_user_id')
      .andWhere('scheduled_send_after', '<=', asOf)
      .select('*');

    return notifications.map((n) => this.recordToDomain(n));
  }
}