import { Injectable } from '@nestjs/common';
import { TaskStore } from './task.store';
import { Task } from './task.domain';

@Injectable()
export class TasksService {
  constructor(private readonly taskStore: TaskStore) {}

  reader(): Pick<TaskStore, 'findAll' | 'findById' | 'findByTaskName' | 'findEnabled'> {
    return this.taskStore;
  }

  async updateTask(task_name: string, updates: Partial<Task>): Promise<Task> {
    return this.taskStore.update(task_name, updates);
  }
}
