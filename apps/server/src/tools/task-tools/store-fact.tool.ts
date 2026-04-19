import { Injectable, Logger } from '@nestjs/common';
import { TaskHandlerBase, TaskHandlerMetadata } from '../task-handler.base';
import type { TaskHandlerContext } from '../interfaces/task-handler-context';
import { TaskHandlerStatus, type TaskHandlerResult } from '../interfaces/task-handler-result';
import { IsDefined, IsOptional, IsString } from 'class-validator';
import { FactService } from '../../core/fact/fact.service';
import { TaskName } from 'src/core/entities/task/task-name';
import { RegisterTask } from 'src/core/task-registry/decorators/register-task.decorator';
import { TaskRegistryService } from 'src/core/task-registry/registry/task-registry.service';

export class StoreFactParams {
  @IsString()
  @IsDefined()
  key: string;

  @IsString()
  @IsDefined()
  value: string;

  @IsString()
  @IsOptional()
  category?: string;
}

export const StoreFactParamsSchema = `
{
  "type": "object",
  "properties": {
    "key": { "type": "string", "description": "Stable key used to store and retrieve the fact.  Should replace spaces with underscores and be all lower case. " },
    "value": { "type": "string", "description": "Fact value that should be remembered" },
    "category": { "type": "string", "description": "Optional category used to group related facts" }
  },
  "required": ["key", "value"]
}
`;

@Injectable()
@RegisterTask(TaskName.StoreFact)
export class StoreFactTool extends TaskHandlerBase {
  private readonly logger = new Logger(StoreFactTool.name);

  readonly metadata: TaskHandlerMetadata = {
    taskName: TaskName.StoreFact,
    description: 'Store a new fact, preference, or piece of information for later recall',
    parameters: StoreFactParams,
    parametersSchema: StoreFactParamsSchema,
    hints: ['remember that', 'store fact', 'remember this', 'save that', 'note that'],
    actionType: 'store_fact',
  };

  constructor(protected taskRegistryService: TaskRegistryService, private readonly factsService: FactService) {
    super(taskRegistryService);
  }

  async execute(request: TaskHandlerContext): Promise<TaskHandlerResult> {
    const { parameters: params } = request;
    const typedParams = params as StoreFactParams;

    const key = typedParams.key;
    const value = typedParams.value;

    if (!key || !value) {
      return {
        status: TaskHandlerStatus.CLARIFICATION_NEEDED,
        reply: 'Please tell me both what to remember and the details.',
      };
    }

    try {
      await this.factsService.createFact({
        key,
        value,
        ownerUserId: params.user?.userId || null,
        visibilityRoles: [request.user.role],
      }
      );

      return {
        status: TaskHandlerStatus.SUCCESS,
        reply: `Got it! I'll remember "${key}" as "${value}".`,
      };
    } catch (error: any) {
      this.logger.error('StoreFactTool error:', error);
      return {
        status:  TaskHandlerStatus.ERROR,
        error: 'Sorry, I couldn’t save that information right now.',
      };
    }
  }
}
