import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from '../monitoring/audit/audit.service';
import { AbstractEntityStore } from '../abstract-entity.store';
import { KNEX_CONNECTION } from '../../database/knex.constants';
import { TaskRequest } from './task-request.domain';

export interface TaskRequestRecord {
  id: string;
  readable_id: number;
  task_name?: string;
  requester_user_id?: string;
  executor_user_id?: string;
  parameters?: any;
  attachments?: any[];
  status: string;
  device_id?: string;
  requires_approval: boolean;
  approved_by_user_id?: string;
  approved_at?: Date;
  quiet_hours_queued: boolean;
  scheduled_for?: Date;
  executed_at?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
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
      hasUpdatedAt: true,
      hasActiveFlag: false,        // no active flag on task_requests
    });
  }

  protected domainToRecord(domain: Partial<TaskRequest>): Partial<TaskRequestRecord> {
    return {
      id: domain.id,
      readable_id: domain.readableId,
      task_name: domain.taskName,
      requester_user_id: domain.requesterUserId ?? undefined,
      executor_user_id: domain.executorUserId ?? undefined,
      parameters: domain.parameters,
      attachments: domain.attachments ?? [],
      status: domain.status,
      device_id: domain.deviceId ?? undefined,
      requires_approval: domain.requiresApproval ?? false,
      approved_by_user_id: domain.approvedByUserId ?? undefined,
      approved_at: domain.approvedAt ?? undefined,
      quiet_hours_queued: domain.quietHoursQueued ?? false,
      scheduled_for: domain.scheduledFor ?? undefined,
      executed_at: domain.executedAt ?? undefined,
      notes: domain.notes ?? undefined,
    };
  }

  protected recordToDomain(record: TaskRequestRecord): TaskRequest {
    return {
      id: record.id,
      readableId: record.readable_id,
      taskName: record.task_name ?? '',
      requesterUserId: record.requester_user_id ?? undefined,
      executorUserId: record.executor_user_id ?? undefined,
      parameters: record.parameters ?? {},
      attachments: record.attachments ?? [],
      status: record.status,
      deviceId: record.device_id ?? undefined,
      requiresApproval: record.requires_approval,
      approvedByUserId: record.approved_by_user_id ?? undefined,
      approvedAt: record.approved_at ?? undefined,
      quietHoursQueued: record.quiet_hours_queued,
      scheduledFor: record.scheduled_for ?? undefined,
      executedAt: record.executed_at ?? undefined,
      notes: record.notes ?? undefined,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected searchQuery(search: string, query: Knex.QueryBuilder<TaskRequestRecord>): Knex.QueryBuilder<TaskRequestRecord> {
    const escaped = search.trim().replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const like = `%${escaped}%`;
  
    return query.andWhere(function () {
      this.whereRaw(`COALESCE(task_name, '') ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`status ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`CAST(readable_id AS text) ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`CAST(id AS text) ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`COALESCE(requester_user_id, '') ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`COALESCE(executor_user_id, '') ILIKE ? ESCAPE '\\'`, [like]);
    });
  }

  async findPendingApprovals(): Promise<TaskRequest[]> {
    const records = await this.knex<TaskRequestRecord>(this.tableName)
      .where('status', 'awaiting_approval')
      .orderBy('created_at', 'desc');

    return records.map((r) => this.recordToDomain(r));
  }

  async getByReadableId(readableId: number): Promise<TaskRequest | undefined> {
    const record = await this.knex<TaskRequestRecord>(this.tableName)
      .where('readable_id',readableId).first();

      if (!record) {
        return undefined;
      }

      return this.recordToDomain(record); 
  }
}