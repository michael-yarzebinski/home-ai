import { z } from "zod";
import type { Device } from "@home-ai/shared/domain/device/device";
import { addPermissionFlags } from "src/common/utils/permissions";
import { DeviceStore } from "src/core/stores/device/device.store";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ToolContext } from "src/tools/types/tool-context";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { fuzzyFind } from "src/tools/utils/fuzzy-find.utils";

const FindDevicesToolSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      'Natural-language or partial name to match (e.g. "porch lights", "perch lights"). ' +
        "Matched against device slug and friendlyName; typos are OK.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(25)
    .optional()
    .describe("Max matches to return (default 10)."),
});

export interface FindDevicesResult {
  devices: Array<
    Device & {
      canRead: boolean;
      canWrite: boolean;
      score: number;
    }
  >;
  total: number;
  query: string;
}

@Tool()
@Injectable()
export class FindDevicesTool extends ToolHandler<
  typeof FindDevicesToolSchema,
  FindDevicesResult
> {
  readonly name = "find-devices";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Fuzzy-search devices registered in Home AI by slug and friendlyName. " +
    "Prefer this over list-devices when resolving a user phrase to a device id/slug. " +
    "If 0 or many matches, ask for clarification or call list-devices. " +
    "Never invent device ids — only use ids returned here or from list-devices.";

  readonly parameters = FindDevicesToolSchema;

  constructor(private readonly deviceStore: DeviceStore) {
    super();
  }

  async execute(
    params: z.infer<typeof FindDevicesToolSchema>,
    context: ToolContext,
  ): Promise<FindDevicesResult> {
    const devices = await this.deviceStore.getAll(context.authUser, false);
    const available = addPermissionFlags(devices, context.authUser.role);
    const matches = fuzzyFind(
      available,
      params.query,
      (d) => [d.slug, d.friendlyName],
      { limit: params.limit },
    );

    return {
      devices: matches,
      total: matches.length,
      query: params.query,
    };
  }
}
