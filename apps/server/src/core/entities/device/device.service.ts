import { Injectable } from '@nestjs/common';
import { DeviceDto, SearchRequestDto, SearchResponseDto, SearchUtils } from '@home-ai/shared';
import { DeviceStore } from './device.store';
import { Device, NotificationGuidanceRule } from './device.domain';
import { toDeviceDto } from './device.mapper';

@Injectable()
export class DeviceService {
  constructor(private readonly deviceStore: DeviceStore) {}

  /**
   * Reader facade - safe read-only methods for most of the app
   */
  reader(): Pick<DeviceStore, 'getAll' | 'getById' | 'getForUser'> {
    return this.deviceStore;
  }

  /**
   * Create a new device (usually called from admin UI or onboarding)
   */
  async createDevice(data: {
    deviceIdSlug: string;
    friendlyName: string;
    haEntityId?: string;
    visibleToRoles?: string[];
    notificationGuidance?: NotificationGuidanceRule[];
    metadata?: Record<string, any>;
  }): Promise<Device> {
    return this.deviceStore.create({
      deviceIdSlug: data.deviceIdSlug,
      friendlyName: data.friendlyName,
      haEntityId: data.haEntityId,
      visibleToRoles: data.visibleToRoles ?? [],
      notificationGuidance: data.notificationGuidance ?? [],
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

  async search(
    criteria: SearchRequestDto,
  ): Promise<SearchResponseDto<DeviceDto>> {
    const { skip, take } = SearchUtils.toSkipTake(criteria);
    const result = await this.deviceStore.search(
      criteria.search,
      skip,
      take,
      criteria.includeInactive,
    );
    const deviceDtos = result.data.map((d) => toDeviceDto(d));
    return SearchUtils.toSearchResponseDto(criteria, deviceDtos, result.total);
  }
}