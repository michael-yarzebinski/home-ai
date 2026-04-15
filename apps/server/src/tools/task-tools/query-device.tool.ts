import { Injectable, Logger } from '@nestjs/common';
import { LLMEventType, LLMServiceBase } from '../../ai/llm-services/llm.service.base';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';
import { QueryDeviceParams } from 'src/core/tasks/task-parameters';
import { TaskName } from 'src/core/tasks/task-name';
import { RegisterTool } from 'src/core/tools/decorators/register-tool.decorator';
import { DevicesService } from 'src/core/devices/devices.service';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';

@Injectable()
@RegisterTool(TaskName.QueryDevice)
export class QueryDeviceTool extends ToolBase {
  private readonly logger = new Logger(QueryDeviceTool.name);

  readonly metadata = {
    taskName: TaskName.QueryDevice,
    description: 'Query the current state or attributes of any Home Assistant device using natural language',
    parameterDto: QueryDeviceParams,
    hints: ['what is the', 'status of', 'check the', 'is the light on', 'what temperature', 'query device'],
    actionType: 'query_device',
  };

  constructor(
    protected toolRegistryService: ToolRegistryService,
    private readonly deviceService: DevicesService,
    private readonly llmService: LLMServiceBase,
  ) {
    super(toolRegistryService);
  }

  async execute(request: ToolRequest): Promise<ToolResult> {
    const { parameters, user } = request.dispatchRequest;
    const params = parameters as QueryDeviceParams;

    try {
      const visibleDevices = await this.deviceService.findForUser(user);

      if (visibleDevices.length === 0) {
        return {
          success: true,
          reply: "You don't have any devices set up yet.",
        };
      }

      const resolutionPrompt = `
You are a precise Home AI assistant.
User query: "${params.query}"

Available devices the user can access:
${visibleDevices.map(d => `- ${d.friendlyName} (${d.deviceType}) [entity_id: ${d.haEntityId}]`).join('\n')}

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

      const finalAnswer = await this.llmService.queryLLM<string>({
        prompt: responsePrompt,
        userId: user.id,
        eventType: LLMEventType.TASK_FOLLOWUP
      });

      return {
        success: true,
        reply: finalAnswer,
        data: { resolvedEntity: resolution.haEntityId },
      };

    } catch (error: any) {
      this.logger.error('Error in QueryDeviceTool:', error);
      return {
        success: false,
        reply: 'Sorry, I had trouble querying your devices.',
      };
    }
  }
}
