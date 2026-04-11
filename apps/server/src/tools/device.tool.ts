import { Injectable } from '@nestjs/common';
import { DevicesService } from '../modules/devices/devices.service';
import { TaskRequestsService } from '../modules/task-requests/task-requests.service';

@Injectable()
export class DeviceTool {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly taskRequestsService: TaskRequestsService,
  ) {}

  /**
   * Add a new device to the system
   * This matches the style of your other tools
   */
  async addDevice(parameters: any, userId: string): Promise<{
    success: boolean;
    message: string;
    device?: any;
  }> {
    try {
      const {
        device_id_slug,
        device_type,
        friendly_name,
        ha_entity_id,
        notification_guidance = {},
      } = parameters;

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

      // Log the action in task_requests for audit
      await this.taskRequestsService.create({
        task_name: 'add_device',
        requester_user_id: userId,
        executor_user_id: userId,
        parameters,
        status: 'executed',
        source_type: 'user',
        device_id_slug,
        device_metadata: { ha_entity_id },
      });

      return {
        success: true,
        message: `Successfully added device "${friendly_name}" (${device_id_slug}).`,
        device: newDevice,
      };

    } catch (error: any) {
      console.error('Error in DeviceTool.addDevice:', error);
      return {
        success: false,
        message: `Failed to add device: ${error.message}`,
      };
    }
  }
}