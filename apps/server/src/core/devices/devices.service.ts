import { Injectable } from '@nestjs/common';
import { DeviceStore } from './device.store';
import { Device } from './device.domain';
import { User } from '../users/user.domain';

@Injectable()
export class DevicesService {
  constructor(private readonly deviceStore: DeviceStore) {}

  reader(): Pick<DeviceStore, 'findBySlug' | 'findByHaEntityId' | 'findAllEnabled'> {
    return this.deviceStore;
  }

  async findForUser(user: User) {
    return this.deviceStore.findForUser(user.id, user.role);
  }

  async create(deviceData: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device> {
    return this.deviceStore.create(deviceData as any);
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
