import { z } from "zod";
import { Injectable } from "@nestjs/common";
import { DeviceEventStore } from "src/core/stores/device/device-event.store";
import { DeviceStore } from "src/core/stores/device/device.store";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { Tool } from "src/tools/decorators/tool.decorator";
import type { ToolContext } from "src/tools/types/tool-context";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";

const MAX_EVENTS = 200;

const GetDeviceEventHistoryToolSchema = z.object({
  deviceId: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().min(1))
    .describe(
      "The ID of the device whose event history to fetch. Use list-devices if unknown.",
    ),
  days: z
    .preprocess(
      ToolParameterUtils.toNumberValue,
      z.number().int().min(1).max(30),
    )
    .describe("How many days of history to include (1–30)"),
});

export interface GetDeviceEventHistoryResult {
  success: boolean;
  message: string;
  deviceId?: string;
  deviceSlug?: string;
  days?: number;
  total?: number;
  truncated?: boolean;
  events?: Array<{
    entityId: string;
    oldState: string | null;
    newState: string;
    createdAt: Date;
  }>;
}

@Tool()
@Injectable()
export class GetDeviceEventHistoryTool extends ToolHandler<
  typeof GetDeviceEventHistoryToolSchema,
  GetDeviceEventHistoryResult
> {
  readonly name = "get-device-event-history";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Get recent Home AI device event history (state changes) for a registered device. " +
    "Use list-devices to resolve deviceId. Returns old/new state per entity, newest first.";

  readonly parameters = GetDeviceEventHistoryToolSchema;

  constructor(
    private readonly deviceStore: DeviceStore,
    private readonly deviceEventStore: DeviceEventStore,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof GetDeviceEventHistoryToolSchema>,
    context: ToolContext,
  ): Promise<GetDeviceEventHistoryResult> {
    const device = await this.deviceStore.getById(
      params.deviceId,
      context.authUser,
    );
    if (!device) {
      return {
        success: false,
        message: `Device ${params.deviceId} was not found`,
      };
    }

    const since = new Date();
    since.setDate(since.getDate() - params.days);

    const { items, total } = await this.deviceEventStore.getHistoryByDeviceId(
      device.id,
      since,
      context.authUser,
      MAX_EVENTS,
    );

    return {
      success: true,
      message:
        total === 0
          ? `No events in the last ${params.days} day(s) for ${device.friendlyName}`
          : `Found ${total} event(s) in the last ${params.days} day(s) for ${device.friendlyName}`,
      deviceId: device.id,
      deviceSlug: device.slug,
      days: params.days,
      total,
      truncated: total > items.length,
      events: items.map((event) => ({
        entityId: event.entityId,
        oldState: event.oldState,
        newState: event.newState,
        createdAt: event.createdAt,
      })),
    };
  }
}
