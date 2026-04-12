import { Injectable } from '@nestjs/common';
import { TaskStore } from './task.store';
import { Task } from './task.domain';

@Injectable()
export class TasksService {
  constructor(private readonly taskStore: TaskStore) {}

  reader(): Pick<TaskStore, 'findAll' | 'findById' | 'findByTaskName'> {
    return this.taskStore;
  }

  async findAll(): Promise<Task[]> {
    return this.taskStore.findEnabled();
  }

  async findEnabledForAI(): Promise<Task[]> {
    return this.taskStore.findEnabled();
  }

  async findOne(task_name: string): Promise<Task | null> {
    return this.taskStore.findByTaskName(task_name);
  }

  async updateTask(task_name: string, updates: Partial<Task>): Promise<Task> {
    return this.taskStore.update(task_name, updates);
  }
}
