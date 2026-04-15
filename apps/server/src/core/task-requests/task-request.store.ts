import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from '../audit/audit.service';
import { AbstractEntityStore } from '../abstract-entity.store';
import { KNEX_CONNECTION } from '../database/knex.constants';
import { TaskRequest } from './task-request.domain';

/**
 * Database record shape for the 'task_requests' table (snake_case, matches schema exactly).
 * ONLY includes columns that exist in initial_schema.ts migration.
 * Record interface is kept inside the store file (per project convention).
 */
export interface TaskRequestRecord {
  id: number;
  task_name: string;
  requester_user_id?: string | null;
  executor_user_id?: string | null;
  parameters: Record<string, any>;
  raw_message?: string | null;
  attachments?: any;
  status: string;

  // Device-related fields
  source_type: string;
  device_id_slug?: string | null;
  event_type?: string | null;
  device_metadata?: Record<string, any> | null;

  // Approval & quiet hours
  requires_approval: boolean;
  approved_by_user_id?: string | null;
  approved_at?: Date | null;
  quiet_hours_queued: boolean;
  scheduled_for?: Date | null;

  created_at: Date;
  executed_at?: Date | null;
  updated_at?: Date | null;
  notes?: string | null;
}

@Injectable()
export class TaskRequestStore extends AbstractEntityStore<TaskRequestRecord, TaskRequest> {
  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
  ) {
    super(knex, auditService, {
      tableName: 'task_requests',
      auditEntityType: 'TaskRequest',
      primaryKey: 'request_id',
      hasUpdatedAt: true,
    });
  }

  /**
   * Map domain (camelCase) to DB record (snake_case).
   * Conservative mapping — only fields that exist in the schema.
   */
  protected domainToRecord(domain: Partial<TaskRequest>): Partial<TaskRequestRecord> {
    const record: Partial<TaskRequestRecord> = {};

    if (domain.id !== undefined) record.id = domain.id;
    if (domain.taskName !== undefined) record.task_name = domain.taskName;
    if (domain.requesterUserId !== undefined) record.requester_user_id = domain.requesterUserId;
    if (domain.executorUserId !== undefined) record.executor_user_id = domain.executorUserId;
    if (domain.parameters !== undefined) record.parameters = domain.parameters;
    if (domain.rawMessage !== undefined) record.raw_message = domain.rawMessage;
    if (domain.attachments !== undefined) record.attachments = domain.attachments;
    if (domain.status !== undefined) record.status = domain.status;
    if (domain.sourceType !== undefined) record.source_type = domain.sourceType;
    if (domain.deviceIdSlug !== undefined) record.device_id_slug = domain.deviceIdSlug;
    if (domain.eventType !== undefined) record.event_type = domain.eventType;
    if (domain.deviceMetadata !== undefined) record.device_metadata = domain.deviceMetadata;
    if (domain.requiresApproval !== undefined) record.requires_approval = domain.requiresApproval;
    if (domain.approvedByUserId !== undefined) record.approved_by_user_id = domain.approvedByUserId;
    if (domain.approvedAt !== undefined) record.approved_at = domain.approvedAt;
    if (domain.quietHoursQueued !== undefined) record.quiet_hours_queued = domain.quietHoursQueued;
    if (domain.scheduledFor !== undefined) record.scheduled_for = domain.scheduledFor;
    if (domain.createdAt !== undefined) record.created_at = domain.createdAt;
    if (domain.executedAt !== undefined) record.executed_at = domain.executedAt;
    if (domain.updatedAt !== undefined) record.updated_at = domain.updatedAt;
    if (domain.notes !== undefined) record.notes = domain.notes;

    return record;
  }

  /**
   * Map DB record (snake_case) to domain (camelCase).
   * Preserves all schema fields without inventing new ones.
   */
  protected recordToDomain(record: TaskRequestRecord): TaskRequest {
    return {
      id: record.id,
      taskName: record.task_name,
      requesterUserId: record.requester_user_id || undefined,
      executorUserId: record.executor_user_id || undefined,
      parameters: record.parameters,
      rawMessage: record.raw_message || undefined,
      attachments: record.attachments,
      status: record.status,
      sourceType: record.source_type,
      deviceIdSlug: record.device_id_slug || undefined,
      eventType: record.event_type || undefined,
      deviceMetadata: record.device_metadata || undefined,
      requiresApproval: record.requires_approval,
      approvedByUserId: record.approved_by_user_id || undefined,
      approvedAt: record.approved_at || undefined,
      quietHoursQueued: record.quiet_hours_queued,
      scheduledFor: record.scheduled_for || undefined,
      createdAt: record.created_at,
      executedAt: record.executed_at || undefined,
      updatedAt: record.updated_at || undefined,
      notes: record.notes || undefined,
    };
  }

  /**
   * Specialized method used by ToolRouter and controllers.
   */
  async findByRequestId(requestId: number): Promise<TaskRequest | null> {
    return this.findOneBy({ request_id: requestId } as any);
  }

  /**
   * Used by findPendingApprovals in the service.
   */
  async findPendingApprovals(): Promise<TaskRequest[]> {
    const records = await this.knex<TaskRequestRecord>(this.tableName)
      .where('status', 'awaiting_approval')
      .orderBy('created_at', 'desc');

    return records.map((r) => this.recordToDomain(r));
  }

  /**
   * Used by device event queries.
   */
  async findPendingDeviceEvents(): Promise<TaskRequest[]> {
    const records = await this.knex<TaskRequestRecord>(this.tableName)
      .where('source_type', 'device')
      .where('status', 'pending')
      .orderBy('created_at');

    return records.map((r) => this.recordToDomain(r));
  }
}