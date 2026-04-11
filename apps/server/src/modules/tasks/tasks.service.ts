import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';

export interface TaskRecord {
  task_name: string;
  description: string;
  request_roles?: string;
  execute_roles: string;
  notify_roles?: string;
  action_type: string;
  parameters_schema?: any;
  target?: string;
  enabled: boolean;
}

@Injectable()
export class TasksService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async findAll() {
    return this.knex('tasks')
      .where('enabled', true)
      .orderBy('task_name')
      .select('*');
  }

  /**
   * NEW: Get only enabled tasks with minimal fields needed for AI decision
   */
  async findEnabledForAI() {
    return this.knex('tasks')
      .where('enabled', true)
      .select('task_name', 'description', 'parameters_schema')
      .orderBy('task_name');
  }

  async findOne(task_name: string) {
    return this.knex('tasks')
      .where('task_name', task_name)
      .first();
  }

  async updateTask(task_name: string, updates: Partial<any>) {
    return this.knex('tasks')
      .where('task_name', task_name)
      .update(updates)
      .returning('*');
  }
}