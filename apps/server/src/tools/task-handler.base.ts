import { Injectable, Logger } from '@nestjs/common';
import type { TaskHandlerContext } from './interfaces/task-handler-context';
import type { TaskHandlerResult as TaskHandlerResult } from './interfaces/task-handler-result';
import { TaskName } from 'src/core/entities/task/task-name';
import { TaskRegistryService } from 'src/core/task-registry/registry/task-registry.service';

export interface TaskHandlerMetadata {
  taskName: TaskName;
  description: string;
  parameters: new () => any;
  parametersSchema: string;
  hints?: string[];
  actionType?: string;
}

@Injectable()
export abstract class TaskHandlerBase {
  abstract readonly metadata: TaskHandlerMetadata;

  constructor(protected taskRegistryService: TaskRegistryService) {}

  getMetadata(): TaskHandlerMetadata {
    return this.metadata;
  }

  abstract execute(request: TaskHandlerContext): Promise<TaskHandlerResult>;

  canHandle(taskName: TaskName | string): boolean {
    return this.metadata.taskName === taskName;
  }
}
