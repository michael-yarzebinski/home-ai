import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from '../monitoring/audit/audit.service';
import { AbstractEntityStore } from '../abstract-entity.store';
import { KNEX_CONNECTION } from '../../database/knex.constants';
import { Device } from './device.domain';

export interface DeviceRecord {
  id: string;
  device_id_slug: string;
  friendly_name: string;
  ha_entity_id?: string | null;
  notification_guidance: any;
  visible_to_roles: string[];
  active: boolean;
  metadata: any;
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
      hasUpdatedAt: true,
      hasActiveFlag: true,
    });
  }

  protected domainToRecord(domain: Partial<Device>): Partial<DeviceRecord> {
    return {
      id: domain.id,
      device_id_slug: domain.deviceIdSlug,
      friendly_name: domain.friendlyName,
      ha_entity_id: domain.haEntityId,
      notification_guidance: domain.notificationGuidance ?? {},
      visible_to_roles: domain.visibleToRoles ?? [],
      active: domain.active,
      metadata: domain.metadata ?? {},
    };
  }

  protected recordToDomain(record: DeviceRecord): Device {
    return {
      id: record.id,
      deviceIdSlug: record.device_id_slug,
      friendlyName: record.friendly_name,
      haEntityId: record.ha_entity_id ?? undefined,
      notificationGuidance: record.notification_guidance ?? {},
      visibleToRoles: record.visible_to_roles ?? [],
      active: record.active,
      metadata: record.metadata ?? {},
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected searchQuery(search: string, query: Knex.QueryBuilder<DeviceRecord>): Knex.QueryBuilder<DeviceRecord> {
    const escaped = search.trim().replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const like = `%${escaped}%`;
  
    return query.andWhere(function () {
      this.whereRaw(`friendly_name ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`device_id_slug ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`COALESCE(ha_entity_id, '') ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`CAST(id AS text) ILIKE ? ESCAPE '\\'`, [like]);
    });
  }

  async getForUser(userRole: string): Promise<Device[]> { 
    const records = await this.knex<DeviceRecord>('devices')
      .where('active', true)
      .andWhere((builder) => {
        builder
          .whereRaw('visible_to_roles && ?', [userRole]); 
      })
      .orderBy('friendly_name', 'asc');
  
    return records.map(record => this.recordToDomain(record));
  }
}