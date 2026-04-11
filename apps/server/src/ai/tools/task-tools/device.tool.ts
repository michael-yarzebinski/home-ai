import { Injectable } from '@nestjs/common';
import { DevicesService } from '../../../modules/devices/devices.service';
import { TaskRequestsService } from '../../../modules/task-requests/task-requests.service';
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
        device_id_slug,
        device_type,
        friendly_name,
        ha_entity_id,
        notification_guidance = {},
      } = params;

      const userId = contextUser?.user_id || params.userId || 'unknown';

      if (!device_id_slug || !device_type || !friendly_name) {
        return {
          success: false,
          message: 'Missing required parameters: device_id_slug, device_type, and friendly_name are required.',
        };
      }

      // Create the device using DevicesService
      const newDevice = await this.devicesService.create({
        device_id_slug,
        device_type,
        friendly_name,
        ha_entity_id: ha_entity_id || null,
        notification_guidance,
        event_types: [],
        owner_user_id: userId,
        visible_to_roles: 'parent,admin',
        enabled: true,
      });


      return {
        success: true,
        message: `Successfully added device "${friendly_name}" (${device_id_slug}).`,
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
