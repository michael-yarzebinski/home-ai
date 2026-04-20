import { Injectable, NotFoundException } from '@nestjs/common';
import { SearchRequestDto, SearchResponseDto, SearchUtils, TaskDto } from '@home-ai/shared';
import { TaskStore } from './task.store';
import { Task } from './task.domain';
import { toTaskDto } from './task.mapper';

@Injectable()
export class TasksService {
  constructor(private readonly taskStore: TaskStore) {}

  reader(): Pick<TaskStore, 'getAll' | 'getById' | 'getByTaskName'> {
    return this.taskStore;
  }

  async createTask(data: Omit<Task, 'createdAt' | 'updatedAt'>): Promise<Task> {
    return this.taskStore.create(data);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const existingTask = await this.taskStore.getById(id, true);
    if (!existingTask) {
      throw new NotFoundException(`Task "${id}" not found`);
    }
    return this.taskStore.update(existingTask.id, updates);
  }

  async setTaskActive(id: string, active: boolean): Promise<Task> {
    const existingTask = await this.taskStore.getById(id, true);
    if (!existingTask) {
      throw new NotFoundException(`Task "${id}" not found`);
    }
    return this.taskStore.setActive(existingTask.id, active);
  }

  async search(
    criteria: SearchRequestDto,
  ): Promise<SearchResponseDto<TaskDto>> {
    const { skip, take } = SearchUtils.toSkipTake(criteria);
    const result = await this.taskStore.search(
      criteria.search,
      skip,
      take,
      criteria.includeInactive,
    );
    const taskDtos = result.data.map((t) => toTaskDto(t));
    return SearchUtils.toSearchResponseDto(criteria, taskDtos, result.total);
  }
}