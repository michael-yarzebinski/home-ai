// src/tools/default/discover-devices.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { HomeAssistantService } from '../../../integrations/home-assistant/home-assistant.service';
import type { ToolContext } from '../../types/tool-context';
import type { HassEntity } from 'home-assistant-js-websocket';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const DiscoverDevicesToolSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe('Search term — can be part of entity ID, friendly name, room, category, or alias'),
});

export interface DiscoverDevicesResult {
  devices: Array<{
    slug: string;
    friendlyName: string;
    room?: string;
    category?: string;
    entityIds: string[];
  }>;
  totalFound: number;
  message: string;
}

@Tool()
@Injectable()
export class DiscoverDevicesTool extends ToolHandler<
  typeof DiscoverDevicesToolSchema,
  DiscoverDevicesResult
> {
  readonly name = 'discover-devices';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Discover devices from Home Assistant by searching entity IDs, friendly names, or attributes. ' +
    'This tool reaches out to the external Home Assistant service. ' +
    'Use this when the user refers to a device by name and it may not yet be registered in our system.';

  readonly parameters = DiscoverDevicesToolSchema;

  constructor(private readonly haService: HomeAssistantService) {
    super();
  }

  async execute(
    params: z.infer<typeof DiscoverDevicesToolSchema>,
    context: ToolContext,
  ): Promise<DiscoverDevicesResult> {
    const allEntities = await this.haService.getAllEntities();

    const searchTerm = params.query.toLowerCase().trim();

    const matchingEntities = Object.values(allEntities).filter((entity: HassEntity) => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes?.friendly_name || '').toLowerCase();
      const deviceClass = (entity.attributes?.device_class || '').toLowerCase();

      return (
        entityId.includes(searchTerm) ||
        friendlyName.includes(searchTerm) ||
        deviceClass.includes(searchTerm)
      );
    });

    const grouped = new Map<string, any>();

    matchingEntities.forEach((entity: HassEntity) => {
      const deviceId = entity.attributes?.device_id || entity.entity_id;
      if (!grouped.has(deviceId)) {
        grouped.set(deviceId, {
          slug: entity.attributes?.friendly_name?.toLowerCase().replace(/\s+/g, '_') || deviceId,
          friendlyName: entity.attributes?.friendly_name || deviceId,
          room: entity.attributes?.room,
          category: entity.attributes?.device_class,
          entityIds: [],
        });
      }
      grouped.get(deviceId)!.entityIds.push(entity.entity_id);
    });

    const devices = Array.from(grouped.values());

    return {
      devices,
      totalFound: devices.length,
      message: `Found ${devices.length} matching devices in Home Assistant.`,
    };
  }
}
