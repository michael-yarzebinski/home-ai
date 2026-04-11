import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';

export interface DeviceRecord {
  device_id: number;
  device_id_slug: string;
  device_type: string;
  friendly_name: string;
  ha_entity_id?: string | null;
  ha_device_id?: string | null;
  notification_guidance: Record<string, any>;
  event_types: string[];
  owner_user_id?: string | null;
  visible_to_roles?: string | null;
  enabled: boolean;
  last_seen_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class DevicesService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  /**
   * Create a new device
   */
  async create(deviceData: Omit<DeviceRecord, 'device_id' | 'created_at' | 'updated_at'>): Promise<DeviceRecord> {
    const [device] = await this.knex('devices')
      .insert({
        ...deviceData,
        notification_guidance: deviceData.notification_guidance || {},
        event_types: deviceData.event_types || [],
        enabled: deviceData.enabled ?? true,
      })
      .returning('*');

    return device;
  }

  /**
   * Find device by slug (most common lookup)
   */
  async findBySlug(device_id_slug: string): Promise<DeviceRecord | null> {
    return this.knex('devices')
      .where('device_id_slug', device_id_slug)
      .first<DeviceRecord>();
  }

  /**
   * Find device by HA entity ID
   */
  async findByHaEntityId(ha_entity_id: string): Promise<DeviceRecord | null> {
    return this.knex('devices')
      .where('ha_entity_id', ha_entity_id)
      .first<DeviceRecord>();
  }

  /**
   * Get all enabled devices
   */
  async findAllEnabled(): Promise<DeviceRecord[]> {
    return this.knex('devices')
      .where('enabled', true)
      .orderBy('friendly_name')
      .select('*');
  }

  /**
   * Update device (e.g. change notification_guidance)
   */
  async update(device_id_slug: string, updates: Partial<DeviceRecord>): Promise<DeviceRecord | null> {
    const [device] = await this.knex('devices')
      .where('device_id_slug', device_id_slug)
      .update({
        ...updates,
        updated_at: this.knex.fn.now(),
      })
      .returning('*');

    return device || null;
  }

  /**
   * Delete device
   */
  async delete(device_id_slug: string): Promise<boolean> {
    const deleted = await this.knex('devices')
      .where('device_id_slug', device_id_slug)
      .delete();

    return deleted > 0;
  }

  /**
   * Update last_seen_at when a device event arrives
   */
  async updateLastSeen(device_id_slug: string): Promise<void> {
    await this.knex('devices')
      .where('device_id_slug', device_id_slug)
      .update({ last_seen_at: this.knex.fn.now() });
  }
}