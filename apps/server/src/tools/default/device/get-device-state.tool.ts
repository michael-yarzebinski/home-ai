// src/tools/default/get-device-state.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { HomeAssistantService } from '../../../integrations/home-assistant/home-assistant.service';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

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
  }>;
  lastUpdated: string;
}

@Tool()
@Injectable()
export class GetDeviceStateTool extends ToolHandler<typeof GetDeviceStateToolSchema, GetDeviceStateResult> {
  readonly name = 'get-device-state';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Get the current state of a logical device by its slug (e.g. "bedroom_humidifier", "logitech_humidifier_pro"). ' +
    'Returns all related HA entities and their current states.';

  readonly parameters = GetDeviceStateToolSchema;

  constructor(private readonly haService: HomeAssistantService) {
    super();
  }

  async execute(
    params: z.infer<typeof GetDeviceStateToolSchema>,
    context: ToolContext,
  ): Promise<GetDeviceStateResult> {
    const result = await this.haService.getDeviceState(params.slug);

    return {
      deviceSlug: result.deviceSlug,
      entities: result.entities,
      lastUpdated: result.lastUpdated,
    };
  }
}
