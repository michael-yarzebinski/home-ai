import { Injectable } from "@nestjs/common";
import { LLMServiceBase } from "src/ai/llm-services/llm.service.base";
import { LLMAction, LLMEventType } from "src/ai/llm.dtos";
import { LogService } from "src/core/entities/monitoring/log/log.serice";
import { NotificationService } from "src/core/entities/notification/notification.service";
import { TaskHandlerContext } from "../interfaces/task-handler-context";
import { TaskHandlerResult, TaskHandlerStatus } from "../interfaces/task-handler-result";
import { TaskHandlerBase, TaskHandlerMetadata } from '../task-handler.base';
import { TaskName } from "src/core/entities/task/task-name";
import { UsersService } from "src/core/entities/user/user.service";
import { RegisterTask } from "src/core/task-registry/decorators/register-task.decorator";
import { IsObject, IsDefined, IsString, IsOptional } from "class-validator";
import { TaskRegistryService } from "src/core/task-registry/registry/task-registry.service";
import { Device } from "src/core/entities/device/device.domain";

export class NotifyForDeviceParams {
    @IsObject()
    @IsDefined()
    device: Device;
  
    @IsString()
    @IsDefined()
    entityId: string;
  
    @IsString()
    @IsOptional()
    oldState?: string;
  
    @IsString()
    @IsDefined()
    newState: string;
  
    @IsObject()
    @IsOptional()
    attributes?: Record<string, any>;
  
    @IsString()
    @IsOptional()
    lastChanged?: string;
  }
  
  export const NotifyForDeviceParamsSchema = `
  {
    "type": "object",
    "properties": {
      "device": { 
        "type": "object", 
        "description": "The full DeviceRecord from your device store (contains friendly_name, notification_guidance, visible_to_roles, etc.)" 
      },
      "entityId": { 
        "type": "string", 
        "description": "Home Assistant entity_id that changed (e.g. sensor.superior_6000s_humidity)" 
      },
      "oldState": { 
        "type": "string", 
        "description": "Previous state value of the entity" 
      },
      "newState": { 
        "type": "string", 
        "description": "New/current state value of the entity" 
      },
      "attributes": { 
        "type": "object", 
        "description": "All attributes from the new_state (unit_of_measurement, device_class, friendly_name, etc.)" 
      },
      "lastChanged": { 
        "type": "string", 
        "description": "ISO timestamp when the state last changed" 
      }
    },
    "required": ["device", "entityId", "newState"]
  }
  `;

@Injectable()
@RegisterTask(TaskName.NotifyForDevice)
export class NotifyForDeviceHandler extends TaskHandlerBase {
  constructor(
    protected taskRegistryService: TaskRegistryService,
    private readonly llmService: LLMServiceBase,
    private readonly notificationService: NotificationService,
    private readonly usersService: UsersService,
  ) {
    super(taskRegistryService)
  }


  readonly metadata: TaskHandlerMetadata = {
    taskName: TaskName.NotifyForDevice,
    description: 'Process Home Assistant device/entity state changes and intelligently decide whether + how to notify users using the device\'s notification_guidance',
    parameters: NotifyForDeviceParams,
    parametersSchema: NotifyForDeviceParamsSchema,
    hints: ['device changed', 'ha update', 'state change', 'entity triggered', 'sensor update'],
    actionType: 'notify_for_device',
  };

  async execute(context: TaskHandlerContext): Promise<TaskHandlerResult> {
    const { device, entityId, oldState, newState, attributes } = context.parameters;

    const prompt = `You are an intelligent home notification assistant.

Device: ${device.friendly_name}
Entity that changed: ${entityId}
State changed from "${oldState ?? 'unknown'}" to "${newState}"
Attributes: ${JSON.stringify(attributes ?? {})}

Here are ALL notification rules for this device:
${JSON.stringify(device.notificationGuidance, null, 2)}

Your job:
1. Decide which rule(s) apply to this specific entity.
2. Decide if a notification should be sent.
3. Write a short, natural message.
4. Choose which roles should receive it.

Return ONLY valid JSON in this exact format:
{
  "shouldNotify": boolean,
  "message": string,
  "rolesToNotify": string[]
}`;

    const decision = await this.llmService.queryLLM<{
      action: LLMAction.EXECUTE,
      shouldNotify: boolean;
      message: string;
      rolesToNotify: string[];
    }>({
      prompt,
      userId: context.user.id,
      eventType: LLMEventType.NOTIFICATION_MESSAGE,
    });

    if (!decision.shouldNotify) {
      return { status: TaskHandlerStatus.SUCCESS, reply: 'No notification needed.' };
    }

    const usersToNotify = await this.usersService.reader().getByRoles(decision.rolesToNotify);
    if (usersToNotify.length === 0) {
      return {
        status: TaskHandlerStatus.SUCCESS,
        reply: 'No users notified for this event',
      };
    }

    for (const user of usersToNotify) {
      await this.notificationService.createNotification({
        recipientUserId: user.id,
        messageText: decision.message,
        status: 'pending',
      });
    }

    return {
      status: TaskHandlerStatus.SUCCESS,
      reply: `Notification sent to ${decision.rolesToNotify.join(', ')}`,
    };
  }
}