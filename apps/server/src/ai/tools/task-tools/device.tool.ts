import { Injectable } from '@nestjs/common';
import { DevicesService } from '../../../core/devices/devices.service';
import { TaskRequestsService } from '../../../core/task-requests/task-requests.service';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';

@Injectable()
export class DeviceTool extends ToolBase {
  readonly taskNames = ['add_device'] as const;

  constructor(
    private readonly devicesService: DevicesService,
  ) {
    super();
  }

  canHandle(taskName: string): boolean {
    return this.taskNames.includes(taskName as any);
  }

  /**
   * Add a new device to the system. Note that task_request creation is now
   * handled by the router (per security invariant). This method focuses on
   * the device logic only.
   */
  async execute(request: ToolRequest): Promise<ToolResult> {
    try {
      const { parameters: params, user: contextUser, taskRequestId } = request.request;
      const {
        deviceIdSlug,
        deviceType,
        friendlyName,
        haEntityId,
        notificationGuidance = {},
      } = params;

      const userId = contextUser?.userId || params.userId || 'unknown';

      if (!deviceIdSlug || !deviceType || !friendlyName) {
        return {
          success: false,
          message: 'Missing required parameters: device_id_slug, device_type, and friendly_name are required.',
        };
      }

      // Create the device using DevicesService
      const newDevice = await this.devicesService.create({
        deviceIdSlug,
        deviceType,
        friendlyName,
        haEntityId: haEntityId || null,
        notificationGuidance,
        eventTypes: [],
        ownerUserId: userId,
        visibleToRoles: 'parent,admin',
        enabled: true,
      });


      return {
        success: true,
        message: `Successfully added device "${friendlyName}" (${deviceIdSlug}).`,
        data: newDevice,
        notify: true,
        taskRequestId,
      };

    } catch (error: any) {
      console.error('Error in DeviceTool.execute:', error);
      return {
        success: false,
        message: `Failed to add device: ${error.message}`,
      };
    }
  }

}
