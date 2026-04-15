import { Injectable, Logger } from '@nestjs/common';
import type { ToolRequest } from './interfaces/tool-request';
import type { ToolResult } from './interfaces/tool-result';
import { TaskName } from 'src/core/tasks/task-name';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';

export interface ToolMetadata {
  taskName: TaskName;
  description: string;
  parameterDto: new () => any;
  hints?: string[];
  actionType?: string;
}

@Injectable()
export abstract class ToolBase {
  abstract readonly metadata: ToolMetadata;

  constructor(protected toolRegistryService: ToolRegistryService) {}

  getMetadata(): ToolMetadata {
    return this.metadata;
  }

  abstract execute(request: ToolRequest): Promise<ToolResult>;

  canHandle(taskName: TaskName | string): boolean {
    return this.metadata.taskName === taskName;
  }
}
