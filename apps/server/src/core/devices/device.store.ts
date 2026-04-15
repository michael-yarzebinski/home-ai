import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from '../audit/audit.service';
import { AbstractEntityStore } from '../abstract-entity.store';
import { EntityStoreOptions, KNEX_CONNECTION } from '../database/knex.constants';
import { Device } from './device.domain';

export interface DeviceRecord {
  id: string;
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
export class DeviceStore extends AbstractEntityStore<DeviceRecord, Device> {
  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
  ) {
    super(knex, auditService, {
      tableName: 'devices',
      auditEntityType: 'Device',
      primaryKey: 'device_id',
      hasUpdatedAt: true,
    });
  }

  protected domainToRecord(domain: Partial<Device>): Partial<DeviceRecord> {
    const record: Partial<DeviceRecord> = {};
    if (domain.deviceIdSlug !== undefined) record.device_id_slug = domain.deviceIdSlug;
    if (domain.deviceType !== undefined) record.device_type = domain.deviceType;
    if (domain.friendlyName !== undefined) record.friendly_name = domain.friendlyName;
    if (domain.haEntityId !== undefined) record.ha_entity_id = domain.haEntityId;
    if (domain.haDeviceId !== undefined) record.ha_device_id = domain.haDeviceId;
    if (domain.notificationGuidance !== undefined) record.notification_guidance = domain.notificationGuidance;
    if (domain.eventTypes !== undefined) record.event_types = domain.eventTypes;
    if (domain.ownerUserId !== undefined) record.owner_user_id = domain.ownerUserId;
    if (domain.visibleToRoles !== undefined) record.visible_to_roles = domain.visibleToRoles;
    if (domain.enabled !== undefined) record.enabled = domain.enabled;
    if (domain.lastSeenAt !== undefined) record.last_seen_at = domain.lastSeenAt;
    return record;
  }

  protected recordToDomain(record: DeviceRecord): Device {
    return {
      id: record.id,
      deviceIdSlug: record.device_id_slug,
      deviceType: record.device_type,
      friendlyName: record.friendly_name,
      haEntityId: record.ha_entity_id,
      haDeviceId: record.ha_device_id,
      notificationGuidance: record.notification_guidance,
      eventTypes: record.event_types,
      ownerUserId: record.owner_user_id,
      visibleToRoles: record.visible_to_roles,
      enabled: record.enabled,
      lastSeenAt: record.last_seen_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  async findBySlug(deviceIdSlug: string): Promise<Device | null> {
    return this.findOneBy({ device_id_slug: deviceIdSlug } as any);
  }

  async findByHaEntityId(haEntityId: string): Promise<Device | null> {
    return this.findOneBy({ ha_entity_id: haEntityId } as any);
  }

  async findAllEnabled(): Promise<Device[]> {
    const records = await this.knex<DeviceRecord>(this.tableName)
      .where('enabled', true)
      .orderBy('friendly_name')
      .select('*');
    return records.map(r => this.recordToDomain(r));
  }

  async updateLastSeen(deviceIdSlug: string): Promise<void> {
    await this.knex(this.tableName)
      .where('device_id_slug', deviceIdSlug)
      .update({ last_seen_at: this.knex.fn.now() });
  }

  async findForUser(userId: string, role: string): Promise<Device[]> {
    const query = this.knex<DeviceRecord>(this.tableName)
    .where('enabled', true)
    .andWhere((builder) => {
      builder
        // Owner always sees their own devices
        .where('owner_user_id', userId)
        // OR the device is visible to the user's role
        .orWhere((sub) => {
          if (role) {
            sub.whereRaw('visible_to_roles LIKE ?', [`%${role}%`]);
          } else {
            // No role provided → only show devices with no role restriction
            sub.whereNull('visible_to_roles').orWhere('visible_to_roles', '');
          }
        });
    })
    .orderBy('friendly_name', 'asc');

  const records = await query;

  // Convert to Domain objects (consistent with your store pattern)
  return records.map((record) => this.recordToDomain(record));
  }
}
