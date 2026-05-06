// src/tools/default/call-ha-service.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { HomeAssistantService } from '../../../integrations/home-assistant/services/home-assistant.service';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';
import { DeviceStore } from '../../../core/stores/device/device.store';

const ExecuteDeviceServiceToolSchema = z.object({
  deviceId: z
    .string()
    .min(1)
    .describe('The ID of the device to execute the service on'),

  domain: z
    .string()
    .min(1)
    .describe('The domain of the service (e.g. "light", "switch", "climate", "media_player")'),

  service: z
    .string()
    .min(1)
    .describe('The service name to call (e.g. "turn_on", "turn_off", "set_temperature")'),

  data: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      'Optional data/parameters to pass to the service (e.g. {"entity_id": "light.bedroom_lights", "brightness": 255})',
    ),
});

export interface CallHaServiceResult {
  success: boolean;
  data?: any;
  message?: string;
}

@Tool()
@Injectable()
export class ExecuteDeviceServiceTool extends ToolHandler<
  typeof ExecuteDeviceServiceToolSchema,
  CallHaServiceResult
> {
  readonly name = 'execute-device-service';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Call a Home Assistant service for a device registered in Home AI (e.g. light.turn_on, switch.turn_off). ' +
    'Use list-devices to resolve `deviceId` if needed; call get-device-state first to see available services.';

  readonly parameters = ExecuteDeviceServiceToolSchema;

  constructor(
    private readonly deviceStore: DeviceStore,
    private readonly haService: HomeAssistantService) {
    super();
  }

  async execute(
    params: z.infer<typeof ExecuteDeviceServiceToolSchema>,
    context: ToolContext,
  ): Promise<CallHaServiceResult> {
    const result = await this.haService.callService(params.domain, params.service, params.data || {});
    await this.deviceStore.update(params.deviceId, {
      lastTriggeredService: {
        entityId: params.data?.entity_id ?? '',
        service: params.service,
        triggeredBy: context.userId,
        timestamp: new Date(),
        metadata: params.data,
      },
    });

    return {
      success: true,
      data: result,
    };
  }
}
