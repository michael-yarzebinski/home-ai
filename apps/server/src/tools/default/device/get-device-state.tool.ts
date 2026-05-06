// src/tools/default/get-device-state.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { HomeAssistantService } from '../../../integrations/home-assistant/services/home-assistant.service';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';
import { HassDomainServices } from 'home-assistant-js-websocket';

const GetDeviceStateToolSchema = z.object({
  slug: z
    .string()
    .min(1)
    .describe(
      'The slug of the device to get the state for (e.g. "bedroom_humidifier" or "logitech_humidifier_pro")',
    ),
});

export interface GetDeviceStateResult {
  deviceSlug: string;
  entities: Array<{
    entityId: string;
    state: string;
    attributes: Record<string, any>;
    lastChanged?: string;
    services: HassDomainServices;
  }>;
  lastUpdated: string;
}

@Tool()
@Injectable()
export class GetDeviceStateTool extends ToolHandler<typeof GetDeviceStateToolSchema, GetDeviceStateResult> {
  readonly name = 'get-device-state';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Get the current state of a logical device registered in Home AI by its slug (e.g. "bedroom_humidifier"). Use list-devices first if the slug is unknown. ' +
    'Returns related Home Assistant entities and their current states.';

  readonly parameters = GetDeviceStateToolSchema;

  constructor(private readonly haService: HomeAssistantService) {
    super();
  }

  async execute(
    params: z.infer<typeof GetDeviceStateToolSchema>,
    context: ToolContext,
  ): Promise<GetDeviceStateResult> {
    const result = await this.haService.getDeviceStateAndServices(params.slug);

    return {
      deviceSlug: result.deviceSlug,
      entities: result.entities,
      lastUpdated: result.lastUpdated,
    };
  }
}
