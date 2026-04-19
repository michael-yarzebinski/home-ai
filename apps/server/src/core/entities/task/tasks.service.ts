import { Injectable } from '@nestjs/common';
import { TaskStore } from './task.store';
import { Task } from './task.domain';

@Injectable()
export class TasksService {
  constructor(private readonly taskStore: TaskStore) {}

  reader(): Pick<TaskStore, 'getAll' | 'getAllActive' | 'getById' | 'getByTaskName'> {
    return this.taskStore;
  }

  async createTask(data: Omit<Task, 'createdAt' | 'updatedAt'>): Promise<Task> {
    return this.taskStore.create(data);
  }

  async updateTask(taskName: string, updates: Partial<Task>): Promise<Task> {
    return this.taskStore.update(taskName, updates);
  }

  async setTaskActive(taskName: string, active: boolean): Promise<Task> {
    return this.taskStore.setActive(taskName, active);
  }
}