// src/tools/default/discover-devices.tool.ts
import { z } from "zod";
import { ToolHandler } from "../../abstract/tool-handler";
import { HomeAssistantService } from "../../../integrations/home-assistant/services/home-assistant.service";
import type { ToolContext } from "../../types/tool-context";
import type { HassEntity } from "home-assistant-js-websocket";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";

const DiscoverDevicesToolSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      "Search term — can be part of entity ID, friendly name, room, category, or alias",
    ),
});

export interface DiscoverDevicesResult {
  devices: Array<{
    slug: string;
    friendlyName: string;
    room?: string;
    category?: string;
    entityIds: string[];
  }>;
  suggestedSlug: string;
  total: number;
  message: string;
}

@Tool()
@Injectable()
export class DiscoverDevicesTool extends ToolHandler<
  typeof DiscoverDevicesToolSchema,
  DiscoverDevicesResult
> {
  readonly name = "discover-devices";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Discover devices from Home Assistant (external) by entity ID, friendly name, or attributes—use before register-device in Home AI. " +
    "For devices already registered in Home AI, prefer list-devices (permission-filtered).";

  readonly parameters = DiscoverDevicesToolSchema;

  constructor(private readonly haService: HomeAssistantService) {
    super();
  }

  async execute(
    params: z.infer<typeof DiscoverDevicesToolSchema>,
    _context: ToolContext,
  ): Promise<DiscoverDevicesResult> {
    const allEntities = await this.haService.getAllEntities();
    const normalizedQuery = this.normalize(params.query);

    const matchingEntities = Object.values(allEntities).filter(
      (entity: HassEntity) => {
        // Normalize all searchable attributes
        const normalizedId = this.normalize(entity.entity_id);
        const normalizedName = this.normalize(
          entity.attributes?.friendly_name || "",
        );
        const normalizedClass = this.normalize(
          entity.attributes?.device_class || "",
        );

        // Check if the query exists anywhere in the normalized strings
        return (
          normalizedId.includes(normalizedQuery) ||
          normalizedName.includes(normalizedQuery) ||
          normalizedClass.includes(normalizedQuery)
        );
      },
    );

    const grouped = new Map<string, any>();

    matchingEntities.forEach((entity: HassEntity) => {
      const deviceId = entity.attributes?.device_id || entity.entity_id;
      if (!grouped.has(deviceId)) {
        grouped.set(deviceId, {
          slug:
            entity.attributes?.friendly_name
              ?.toLowerCase()
              .replace(/\s+/g, "_") || deviceId,
          friendlyName: entity.attributes?.friendly_name || deviceId,
          room: entity.attributes?.room,
          category: entity.attributes?.device_class,
          entityIds: [],
        });
      }
      grouped.get(deviceId)!.entityIds.push(entity.entity_id);
    });

    const devices = Array.from(grouped.values());
    const suggestedSlug = this.generateSuggestedSlug(
      matchingEntities.map((e) => e.entity_id),
    );

    return {
      devices,
      suggestedSlug,
      total: devices.length,
      message: `Found ${devices.length} matching devices in Home Assistant.`,
    };
  }

  private normalize(text: string): string {
    if (!text) return "";
    return (
      text
        .toLowerCase()
        .trim()
        // Replace underscores, hyphens, and spaces with nothing
        .replace(/[\s_-]/g, "")
    );
  }

  private generateSuggestedSlug(entityIds: string[]): string {
    if (entityIds.length === 0) return "unknown_device";
    if (entityIds.length === 1) {
      // Just strip the domain: "light.kitchen_main" -> "kitchen_main"
      return entityIds[0].split(".")[1];
    }

    // 1. Strip domains: ["sensor.fridge_temp", "binary_sensor.fridge_door"] -> ["fridge_temp", "fridge_door"]
    const objectIds = entityIds.map((id) => id.split(".")[1]);

    // 2. Find the common prefix/stem
    // We'll sort to compare the most different strings first for efficiency
    const sorted = [...objectIds].sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    let i = 0;

    while (i < first.length && first.charAt(i) === last.charAt(i)) {
      i++;
    }

    // 3. Clean up trailing underscores: "fridge_" -> "fridge"
    const stem = first.substring(0, i).replace(/_$/, "");

    // Fallback: if no commonality, use the first object ID
    return stem || objectIds[0];
  }
}
