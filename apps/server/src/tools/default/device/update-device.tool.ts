// src/tools/default/update-device.tool.ts
import { z } from "zod";
import { ToolHandler } from "../../abstract/tool-handler";
import { DeviceStore } from "../../../core/stores/device/device.store";
import type { ToolContext } from "../../types/tool-context";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { Role } from "@home-ai/shared/domain/role/role";

const UpdateDeviceToolSchema = z.object({
  slug: z.string().min(1).describe("The slug of the device to update"),

  friendlyName: z
    .string()
    .optional()
    .describe("New friendly name for the device"),

  room: z.string().optional().describe("Room where the device is located"),

  category: z.string().optional().describe("Category or type of device"),

  aliases: z
    .array(z.string())
    .optional()
    .describe("New list of aliases (replaces existing aliases)"),

  readRoles: z
    .array(z.string())
    .optional()
    .describe("New read roles (replaces existing roles)"),

  writeRoles: z
    .array(z.string())
    .optional()
    .describe("New write roles (replaces existing roles)"),

  extraMetadata: z
    .record(z.string(), z.any())
    .optional()
    .describe("Any additional metadata to store with the device"),
});

export interface UpdateDeviceResult {
  success: boolean;
  message: string;
  slug: string;
}

@Tool()
@Injectable()
export class UpdateDeviceTool extends ToolHandler<
  typeof UpdateDeviceToolSchema,
  UpdateDeviceResult
> {
  readonly name = "update-device";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Update a device registered in Home AI (friendly name, room, category, aliases, roles, or extra metadata).";

  readonly parameters = UpdateDeviceToolSchema;

  constructor(private readonly deviceStore: DeviceStore) {
    super();
  }

  async execute(
    params: z.infer<typeof UpdateDeviceToolSchema>,
    context: ToolContext,
  ): Promise<UpdateDeviceResult> {
    const device = await this.deviceStore.getBySlug(params.slug);

    if (!device) {
      return {
        success: false,
        message: `Device with slug "${params.slug}" not found.`,
        slug: params.slug,
      };
    }

    const updatedDevice = await this.deviceStore.update(
      device.id,
      {
        friendlyName: params.friendlyName,
        room: params.room,
        category: params.category,
        aliases: params.aliases,
        readRoles: params.readRoles as Role[],
        writeRoles: params.writeRoles as Role[],
        extraMetadata: params.extraMetadata,
      },
      context.authUser,
    );

    return {
      success: true,
      message: `✅ Device "${params.slug}" has been updated successfully.`,
      slug: updatedDevice.slug,
    };
  }
}
