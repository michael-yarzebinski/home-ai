import { Injectable, Logger } from '@nestjs/common';
import { RegisterTool } from 'src/core/tools/decorators/register-tool.decorator';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';
import { DeviceStore } from 'src/core/devices/device.store';
import { ToolBase } from '../tool.base';
import { TaskName } from 'src/core/tasks/task-name';
import { AddDeviceParams } from 'src/core/tasks/task-parameters';
import type { ToolRequest } from '../interfaces/tool-request';
import type { ToolResult } from '../interfaces/tool-result';
import { HomeAssistantService } from 'src/remote/home-assistant/home-assistant.service';
import { LLMEventType, LLMServiceBase } from 'src/ai/llm-services/llm.service.base';

type AddDeviceLLMResponse = {
  action: 'execute'
  deviceIdSlug: string;
  deviceType: string;
  haEntityId?: string;
} | {
  action: 'clarify';
  message: string;
}

@RegisterTool(TaskName.AddDevice)
@Injectable()
export class AddDeviceTool extends ToolBase {
  private readonly logger = new Logger(AddDeviceTool.name);

  readonly metadata = {
    taskName: TaskName.AddDevice,
    description: 'Add a new smart device to the Home AI system by providing a friendly name',
    parameterDto: AddDeviceParams,
    hints: ['add device', 'new device', 'setup device', 'register device'],
    actionType: 'add_device',
  };

  constructor(
    private readonly deviceStore: DeviceStore,
    private readonly llmService: LLMServiceBase,
    private readonly homeAssistantService: HomeAssistantService,
    protected readonly toolRegistryService: ToolRegistryService,
  ) {
    super(toolRegistryService);
  }

  async execute(request: ToolRequest): Promise<ToolResult> {
    const { parameters, user } = request.dispatchRequest;
    const parametersTyped = parameters as AddDeviceParams;

    try {
      // Get current HA devices for context (this is what you wanted)
      const haDevices = await this.homeAssistantService.getAllEntities();   // assuming you have this service
      // Step 1: Ask LLM to analyze and decide
      const suggestionPrompt = `
You are attempting to identify a Home Assistant device with a user provided friendly name of "${parametersTyped.friendlyName}"

Current devices in Home Assistant:
${haDevices.map(d => `- ${d.deviceSlug} (entityId: ${d.entityId ?? 'NONE'})`).join('\n') || 'No devices found yet.'}

1) Attempt to find AT LEAST ONE device matching the friendly name.
Scenarios:
1) If no matching device could be found, return the following valid JSON:
    {
      "action": "clarify",
      "message": "Could not find a device matching "${parametersTyped.friendlyName}""
    } 

2) If a SINGLE device matching the friendly name is found, return the following valid JSON:
    {
      "action": "execute",
      "deviceIdSlug": "suggested_slug",
      "deviceType": "best_device_type",
      "haEntityId": "exact_ha_entity_id"
    }
3) If MULTIPLE devices matching the friendly name are found, return the following valid JSON:
    {
      "action": "execute",
      "deviceIdSlug": "suggested_slug",
      "deviceType": "best_device_type",
      "haEntityId": undefined
    }

Rules you MUST follow:
- deviceIdSlug should be generated with lowercase and underscores only.
- Choose the best deviceType from common types
`;

      const suggestion = await this.llmService.queryLLM<AddDeviceLLMResponse>({
        prompt: suggestionPrompt,
        userId: user.id,
        eventType: LLMEventType.TASK_FOLLOWUP,
        chatHistory: request.dispatchRequest.chatHistory,
      });

      if (suggestion.action === 'clarify' && suggestion.message) {
        return {
          success: false,
          reply: suggestion.message
        }
      }

      else if (suggestion.action === 'execute') {
        const newDevice = await this.deviceStore.create({
          deviceIdSlug: suggestion.deviceIdSlug,
          deviceType: suggestion.deviceType,
          friendlyName: parametersTyped.friendlyName.trim(),
          haEntityId: suggestion.haEntityId,
          notificationGuidance: parametersTyped.notificationGuidance,
          eventTypes: [],
          ownerUserId: user.id,
          visibleToRoles: 'parent,admin',
          enabled: true,
        });
      }

      // Step 2: Create the device


      let reply = `Successfully added "${parametersTyped.friendlyName}".`;

      return {
        success: true,
        reply,
      };

    } catch (error: any) {
      this.logger.error('Error in AddDeviceTool:', error);
      return {
        success: false,
        reply: `Failed to add device: ${error.message}`,
      };
    }
  }
}