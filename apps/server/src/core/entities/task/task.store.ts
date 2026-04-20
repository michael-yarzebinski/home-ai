import { Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from '../monitoring/audit/audit.service';
import { AbstractEntityStore } from '../abstract-entity.store';
import { Task } from './task.domain';

export interface TaskRecord {
  id: string;
  task_name: string;
  description: string;
  request_roles: string[];   // jsonb
  execute_roles: string[];
  notify_roles: string[];
  active: boolean;
  version: number;
  created_at: Date;
  updated_at: Date;
}
@Injectable()
export class TaskStore extends AbstractEntityStore<TaskRecord, Task> {
  constructor(knex: Knex, auditService: AuditService) {
    super(knex, auditService, {
      tableName: 'tasks',
      auditEntityType: 'Task',
      hasUpdatedAt: true,
      hasActiveFlag: true,
    });
  }

  protected domainToRecord(d: Partial<Task>): Partial<TaskRecord> {
    return {
      id: d.id,
      task_name: d.taskName,
      description: d.description,
      request_roles: d.requestRoles ?? [],
      execute_roles: d.executeRoles ?? [],
      notify_roles: d.notifyRoles ?? [],
      active: d.active,
      version: d.version,
    };
  }

  protected recordToDomain(r: TaskRecord): Task {
    return {
      id: r.id,
      taskName: r.task_name,
      description: r.description,
      requestRoles: r.request_roles,
      executeRoles: r.execute_roles,
      notifyRoles: r.notify_roles,
      active: r.active,
      version: r.version,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  protected searchQuery(search: string, query: Knex.QueryBuilder<TaskRecord>): Knex.QueryBuilder<TaskRecord> {
    const escaped = search.trim().replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const like = `%${escaped}%`;
  
    return query.andWhere(function () {
      this.whereRaw(`task_name ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`description ILIKE ? ESCAPE '\\'`, [like]);
    });
  }

  async getByTaskName(taskName: string): Promise<Task | null> {
    const taskRecord = await this.knex.where('task_name', taskName).first();
    if (!taskRecord) {
      throw new NotFoundException(`Could not find task with name ${taskName}`);
    }

    return this.recordToDomain(taskRecord);
  }

}