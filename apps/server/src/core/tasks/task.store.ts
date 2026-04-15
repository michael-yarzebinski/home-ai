import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from '../audit/audit.service';
import { AbstractEntityStore } from '../abstract-entity.store';
import { EntityStoreOptions, KNEX_CONNECTION } from '../database/knex.constants';
import { Task } from './task.domain';

/**
 * Database record shape for the 'tasks' table (snake_case, matches schema exactly).
 * This interface is kept inside the store file as per requirements.
 * Matches the fields used in seeds/01_initial_data.ts and the migration.
 */
export interface TaskRecord {
  task_name: string;
  description: string;
  request_roles?: string | null;
  execute_roles: string;
  notify_roles?: string | null;
  action_type: string;
  target?: string | null;
  enabled: boolean;
}

@Injectable()
export class TaskStore extends AbstractEntityStore<TaskRecord, Task> {
  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
  ) {
    super(knex, auditService, {
      tableName: 'tasks',
      auditEntityType: 'Task',
      primaryKey: 'task_name',
      // No updated_at column on tasks table
      hasUpdatedAt: false,
    });
  }

  /**
   * Map domain (camelCase) to DB record (snake_case).
   * Extremely conservative - only maps fields that exist in the current schema.
   * No invented fields.
   */
  protected domainToRecord(domain: Partial<Task>): Partial<TaskRecord> {
    const record: Partial<TaskRecord> = {};

    if (domain.taskName !== undefined) record.task_name = domain.taskName;
    if (domain.description !== undefined) record.description = domain.description;
    if (domain.requestRoles !== undefined) record.request_roles = domain.requestRoles;
    if (domain.executeRoles !== undefined) record.execute_roles = domain.executeRoles;
    if (domain.notifyRoles !== undefined) record.notify_roles = domain.notifyRoles;
    if (domain.actionType !== undefined) record.action_type = domain.actionType;
    if (domain.target !== undefined) record.target = domain.target;
    if (domain.enabled !== undefined) record.enabled = domain.enabled;

    return record;
  }

  /**
   * Map DB record (snake_case) to domain (camelCase).
   * Preserves exact mapping from existing TaskRecord usage.
   */
  protected recordToDomain(record: TaskRecord): Task {
    return {
      taskName: record.task_name,
      description: record.description,
      requestRoles: record.request_roles || undefined,
      executeRoles: record.execute_roles,
      notifyRoles: record.notify_roles || undefined,
      actionType: record.action_type,
      target: record.target || undefined,
      enabled: record.enabled,
    };
  }

  /**
   * Find only enabled tasks - critical for AI pipeline.
   * Matches existing business logic from TasksService.findEnabledForAI().
   */
  async findEnabled(): Promise<Task[]> {
    const records = await this.knex<TaskRecord>(this.tableName)
      .where('enabled', true)
      .orderBy('task_name')
      .select('*');

    return records.map((record) => this.recordToDomain(record));
  }

  /**
   * Find by task name (primary key). Alias for findById to match legacy usage.
   */
  async findByTaskName(taskName: string): Promise<Task | null> {
    return this.findOneBy({ task_name: taskName } as any);
  }
}
