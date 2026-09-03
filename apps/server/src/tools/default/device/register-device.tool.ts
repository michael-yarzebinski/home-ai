// src/tools/default/register-device.tool.ts
import { Role } from "@home-ai/shared/domain/role/role";
import { LLMModelType } from "@home-ai/shared/domain/llm/llm-model-type";
import { Injectable } from "@nestjs/common";
import { DeviceStore } from "src/core/stores/device/device.store";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { Tool } from "src/tools/decorators/tool.decorator";
import { ToolContext } from "src/tools/types/tool-context";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";
import { z } from "zod";

const RegisterDeviceToolSchema = z.object({
  slug: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().min(1))
    .describe(
      'Unique identifier for the device. Use the slug provided by discover-devices (e.g., "living_room_fan") to ensure consistency.',
    ),

  friendlyName: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().min(1))
    .describe("Human-friendly name of the device"),

  room: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("Room where the device is located"),

  category: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("Category/type of device"),

  aliases: z
    .preprocess(ToolParameterUtils.toStringArray, z.array(z.string()))
    .optional()
    .describe("Alternative names the user might use"),

  readRoles: z
    .preprocess(ToolParameterUtils.toRoleArray, z.array(z.nativeEnum(Role)))
    .optional()
    .describe(
      "Roles that can read this device. If omitted, defaults to current user's role.",
    ),

  writeRoles: z
    .preprocess(ToolParameterUtils.toRoleArray, z.array(z.nativeEnum(Role)))
    .optional()
    .describe(
      "Roles that can control this device. If omitted, defaults to current user's role.",
    ),

  llmModelType: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.nativeEnum(LLMModelType).optional(),
    )
    .describe(
      'LLM latency tier for device automations: "soon" (default) or "immediate" (fast path). If omitted, time-sensitive devices use immediate.',
    ),
});

export interface RegisterDeviceResult {
  success: boolean;
  message: string;
  slug: string;
}

@Tool()
@Injectable()
export class RegisterDeviceTool extends ToolHandler<
  typeof RegisterDeviceToolSchema,
  RegisterDeviceResult
> {
  readonly name = "register-device";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Register a logical device in Home AI so it can be controlled and queried via tools. Use discover-devices first to find the Home Assistant entity. " +
    "Admin-only tool.";

  readonly parameters = RegisterDeviceToolSchema;

  constructor(private readonly deviceStore: DeviceStore) {
    super();
  }

  async execute(
    params: z.infer<typeof RegisterDeviceToolSchema>,
    context: ToolContext,
  ): Promise<RegisterDeviceResult> {
    const readRoles = params.readRoles?.length
      ? params.readRoles
      : [context.authUser.role];
    const writeRoles = params.writeRoles?.length
      ? params.writeRoles
      : [context.authUser.role];

    const device = await this.deviceStore.create(
      {
        slug: params.slug,
        friendlyName: params.friendlyName,
        room: params.room,
        category: params.category,
        aliases: params.aliases || [],
        readRoles,
        writeRoles,
        llmModelType: params.llmModelType ?? LLMModelType.SOON,
        extraMetadata: {},
      },
      context.authUser,
    );

    return {
      success: true,
      message: `✅ Device "${params.friendlyName}" has been registered with slug "${params.slug}".`,
      slug: device.slug,
    };
  }
}
