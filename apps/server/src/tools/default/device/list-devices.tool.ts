// src/tools/default/list-devices.tool.ts
import { z } from 'zod';

import type { Device } from '@home-ai/shared/domain/device/device';
import { addPermissionFlags } from 'src/common/utils/permissions';
import { DeviceStore } from 'src/core/stores/device/device.store';
import { ToolHandler } from 'src/tools/abstract/tool-handler';
import { ToolContext } from 'src/tools/types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const ListDevicesToolSchema = z.object({});

export interface ListDevicesResult {
  devices: Array<
    Device & {
      canRead: boolean;
      canWrite: boolean;
    }
  >;
  total: number;
}

@Tool()
@Injectable()
export class ListDevicesTool extends ToolHandler<typeof ListDevicesToolSchema, ListDevicesResult> {
  readonly name = 'list-devices';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'List all devices that are registered in the system. ' + 'Returns only devices the current user has permission to see.';

  readonly parameters = ListDevicesToolSchema;

  constructor(private readonly deviceStore: DeviceStore) {
    super();
  }

  async execute(
    _params: z.infer<typeof ListDevicesToolSchema>,
    context: ToolContext,
  ): Promise<ListDevicesResult> {
    let devices = await this.deviceStore.getAll();

    const availableDevices = addPermissionFlags(devices, context.userRole);

    return {
      devices: availableDevices,
      total: availableDevices.length,
    };
  }
}
