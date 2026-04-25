// src/tools/default/register-device.tool.ts
import { Role } from '@home-ai/shared/domain/role/role';
import { Injectable } from '@nestjs/common';
import { DeviceStore } from 'src/core/stores/device/device.store';
import { ToolHandler } from 'src/tools/abstract/tool-handler';
import { Tool } from 'src/tools/decorators/tool.decorator';
import { ToolContext } from 'src/tools/types/tool-context';
import { z } from 'zod';

const RegisterDeviceToolSchema = z.object({
  slug: z
    .string()
    .min(1)
    .describe(
      'Unique slug to identify all related Home Assistant entities — the link between our logical devices and Home Assistant entities',
    ),

  friendlyName: z.string().min(1).describe('Human-friendly name of the device'),

  room: z.string().optional().describe('Room where the device is located'),

  category: z.string().optional().describe('Category/type of device'),

  aliases: z.array(z.string()).optional().describe('Alternative names the user might use'),

  readRoles: z
    .array(z.string())
    .optional()
    .describe("Roles that can read this device. If omitted, defaults to current user's role."),

  writeRoles: z
    .array(z.string())
    .optional()
    .describe("Roles that can control this device. If omitted, defaults to current user's role."),
});

export interface RegisterDeviceResult {
  success: boolean;
  message: string;
  slug: string;
}

@Tool()
@Injectable()
export class RegisterDeviceTool extends ToolHandler<typeof RegisterDeviceToolSchema, RegisterDeviceResult> {
  readonly name = 'register-device';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Register a new logical device so the AI can control and query it. ' +
    'This links a Home Assistant device into our system. Admin-only tool.';

  readonly parameters = RegisterDeviceToolSchema;

  constructor(private readonly deviceStore: DeviceStore) {
    super();
  }

  async execute(
    params: z.infer<typeof RegisterDeviceToolSchema>,
    context: ToolContext,
  ): Promise<RegisterDeviceResult> {
    const readRoles = params.readRoles?.length
      ? (params.readRoles as Role[])
      : [context.userRole];
    const writeRoles = params.writeRoles?.length
      ? (params.writeRoles as Role[])
      : [context.userRole];

    const device = await this.deviceStore.create({
      slug: params.slug,
      friendlyName: params.friendlyName,
      room: params.room,
      category: params.category,
      aliases: params.aliases || [],
      readRoles,
      writeRoles,
      extraMetadata: {},
    });

    return {
      success: true,
      message: `✅ Device "${params.friendlyName}" has been registered with slug "${params.slug}".`,
      slug: device.slug,
    };
  }
}
