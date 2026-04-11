import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class TasksService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async findAll() {
    return this.knex('tasks')
      .where('enabled', true)
      .orderBy('task_name')
      .select('*');
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