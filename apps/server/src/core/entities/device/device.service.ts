import { Injectable } from '@nestjs/common';
import { DeviceStore } from './device.store';
import { Device } from './device.domain';

@Injectable()
export class DeviceService {
  constructor(private readonly deviceStore: DeviceStore) {}

  /**
   * Reader facade - safe read-only methods for most of the app
   */
  reader(): Pick<DeviceStore, 'getAll' | 'getAllActive' | 'getById' | 'getForUser'> {
    return this.deviceStore;
  }

  /**
   * Create a new device (usually called from admin UI or onboarding)
   */
  async createDevice(data: {
    deviceIdSlug: string;
    friendlyName: string;
    haEntityId?: string;
    notificationGuidance?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<Device> {
    return this.deviceStore.create({
      deviceIdSlug: data.deviceIdSlug,
      friendlyName: data.friendlyName,
      haEntityId: data.haEntityId,
      notificationGuidance: data.notificationGuidance ?? {},
      metadata: data.metadata ?? {},
      active: true,
    });
  }

  /**
   * Update device (admin only)
   */
  async updateDevice(id: string, updates: Partial<Device>): Promise<Device> {
    return this.deviceStore.update(id, updates);
  }

  /**
   * Toggle device active status
   */
  async setDeviceActive(id: string, active: boolean): Promise<Device> {
    return this.deviceStore.setActive(id, active);
  }

  /**
   * Hard delete device (rarely used)
   */
  async deleteDevice(id: string): Promise<number> {
    return this.deviceStore.delete(id);
  }
}