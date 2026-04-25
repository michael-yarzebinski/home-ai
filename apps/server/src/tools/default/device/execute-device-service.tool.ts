// src/tools/default/call-ha-service.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { HomeAssistantService } from '../../../integrations/home-assistant/home-assistant.service';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const ExecuteDeviceServiceToolSchema = z.object({
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
    'Call any Home Assistant service (e.g. light.turn_on, switch.turn_off, climate.set_temperature). ' +
    'Use this tool when the user wants to control or change the state of a device.';

  readonly parameters = ExecuteDeviceServiceToolSchema;

  constructor(private readonly haService: HomeAssistantService) {
    super();
  }

  async execute(
    params: z.infer<typeof ExecuteDeviceServiceToolSchema>,
    context: ToolContext,
  ): Promise<CallHaServiceResult> {
    try {
      const result = await this.haService.callService(params.domain, params.service, params.data || {});

      return {
        success: true,
        data: result,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to call Home Assistant service',
      };
    }
  }
}
