import { Injectable, Logger } from '@nestjs/common';
import { LLMServiceBase } from '../../ai/llm-services/llm.service.base';
import { TaskHandlerBase, TaskHandlerMetadata } from '../task-handler.base';
import type { TaskHandlerContext } from '../interfaces/task-handler-context';
import { TaskHandlerStatus, type TaskHandlerResult } from '../interfaces/task-handler-result';
import { IsDefined, IsOptional, IsString } from 'class-validator';
import { TaskName } from 'src/core/entities/task/task-name';
import { RegisterTask } from 'src/core/task-registry/decorators/register-task.decorator';
import { TaskRegistryService } from 'src/core/task-registry/registry/task-registry.service';
import { DeviceService } from 'src/core/entities/device/device.service';
import { LLMAction, LLMEventType } from 'src/ai/llm.dtos';

export class QueryDeviceParams {
  @IsString()
  @IsDefined()
  query: string;

  @IsString()
  @IsOptional()
  deviceTypeHint?: string;
}

export const QueryDeviceParamsSchema = `
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "description": "Natural language question about a device state or attribute" },
    "deviceTypeHint": { "type": "string", "description": "Optional hint to narrow device resolution" }
  },
  "required": ["query"]
}
`;

@Injectable()
@RegisterTask(TaskName.QueryDevice)
export class QueryDeviceTool extends TaskHandlerBase {
  private readonly logger = new Logger(QueryDeviceTool.name);

  readonly metadata: TaskHandlerMetadata = {
    taskName: TaskName.QueryDevice,
    description: 'Query the current state or attributes of any Home Assistant device using natural language',
    parameters: QueryDeviceParams,
    parametersSchema: QueryDeviceParamsSchema,
    hints: ['what is the', 'status of', 'check the', 'is the light on', 'what temperature', 'query device'],
    actionType: 'query_device',
  };

  constructor(
    protected taskRegistryService: TaskRegistryService,
    private readonly deviceService: DeviceService,
    private readonly llmService: LLMServiceBase,
  ) {
    super(taskRegistryService);
  }

  async execute(request: TaskHandlerContext): Promise<TaskHandlerResult> {
    const { parameters, user } = request;
    const params = parameters as QueryDeviceParams;

    try {
      const visibleDevices = await this.deviceService.reader().getForUser(user.role);

      if (visibleDevices.length === 0) {
        return {
          status: TaskHandlerStatus.CLARIFICATION_NEEDED,
          reply: "You don't have any devices set up yet.",
        };
      }

      const resolutionPrompt = `
You are a precise Home AI assistant.
User query: "${params.query}"

Available devices the user can access:
${visibleDevices.map(d => `- ${d.friendlyName} [entity_id: ${d.haEntityId}]`).join('\n')}

Return ONLY valid JSON:
{
  "haEntityId": "exact ha_entity_id or null",
  "attribute": "temperature | state | brightness | humidity | ...",
  "confidence": number (0.0 to 1.0)
}
`;

      const resolution = await this.llmService.queryLLM<any>({
        prompt: resolutionPrompt,
        userId: user.id,
        eventType: LLMEventType.TASK_FOLLOWUP
      });

      const responsePrompt = `
User asked: "${params.query}"

Device information:
Entity: ${resolution.haEntityId || 'unknown'}
Attribute requested: ${resolution.attribute || 'state'}

Give a short, natural, and friendly answer to the user.`;

      const {result: finalAnswer} = await this.llmService.queryLLM<{action: LLMAction, result: string}>({
        prompt: responsePrompt,
        userId: user.id,
        eventType: LLMEventType.TASK_FOLLOWUP
      });

      return {
        status: TaskHandlerStatus.SUCCESS,
        reply: finalAnswer,
        data: { resolvedEntity: resolution.haEntityId },
      };

    } catch (error: any) {
      this.logger.error('Error in QueryDeviceTool:', error);
      return {
        status: TaskHandlerStatus.ERROR,
        error: 'Sorry, I had trouble querying your devices.',
      };
    }
  }
}
