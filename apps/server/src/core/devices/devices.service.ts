import { Injectable } from '@nestjs/common';
import { DeviceStore } from './device.store';
import { Device } from './device.domain';

@Injectable()
export class DevicesService {
  constructor(private readonly deviceStore: DeviceStore) {}

  reader(): Pick<DeviceStore, 'findBySlug' | 'findByHaEntityId' | 'findAllEnabled'> {
    return this.deviceStore;
  }

  async create(deviceData: Omit<Device, 'deviceId' | 'createdAt' | 'updatedAt'>): Promise<Device> {
    return this.deviceStore.create(deviceData as any);
  }

  async findBySlug(device_id_slug: string): Promise<Device | null> {
    return this.deviceStore.findBySlug(device_id_slug);
  }

  async findByHaEntityId(ha_entity_id: string): Promise<Device | null> {
    return this.deviceStore.findByHaEntityId(ha_entity_id);
  }

  async findAllEnabled(): Promise<Device[]> {
    return this.deviceStore.findAllEnabled();
  }

  async update(device_id_slug: string, updates: Partial<Device>): Promise<Device> {
    return this.deviceStore.update(device_id_slug, updates);
  }

  async delete(device_id_slug: string): Promise<void> {
    await this.deviceStore.delete(device_id_slug);
  }

  async updateLastSeen(device_id_slug: string): Promise<void> {
    return this.deviceStore.updateLastSeen(device_id_slug);
  }
}
