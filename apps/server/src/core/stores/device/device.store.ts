// core/stores/device/device.store.ts
import type { Knex } from 'knex';
import { AbstractEntityStore } from '../abstract/abstract-entity.store';
import type { Device } from '@home-ai/shared/domain/device/device';
import type { SearchCriteria } from '@home-ai/shared/search/search';
import { Paginated } from '@home-ai/shared/search/pagination';
import { AuditStore } from '../audit/audit.store';
import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@home-ai/shared/domain/role/role';

export interface DeviceRecord {
  id: string;
  slug: string;
  friendly_name: string;
  aliases: string[];
  room?: string;
  category?: string;
  read_roles: string[];
  write_roles: string[];
  extra_metadata: any;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class DeviceStore extends AbstractEntityStore<Device, DeviceRecord> {
  constructor(@Inject('KNEX_CONNECTION') knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: 'devices', entityType: 'devices' });
  }

  async search(criteria: SearchCriteria): Promise<Paginated<Device>> {
    return {
        items: [],
        total: 0,
        page: criteria.page,
        pageSize: criteria.pageSize,
        hasNext: false,
        hasPrevious: false,
      };
  }

  async getBySearch(search: string): Promise<Device[]> {
    const searchToLower = search.toLocaleLowerCase();
    const searchLike = `%${search.toLowerCase()}%`;

    const records = await this.active.where((builder) => {
        builder
          .whereILike('slug', searchLike)
          .orWhereILike('friendly_name', searchLike)
          .orWhereRaw('? = ANY(aliases)', [searchToLower]);
      });

    return records.map(r => this.recordToDomain(r));
  }

  async getBySlug(slug: string) : Promise<Device | undefined> {
    const record = await this.active.where('slug', slug).first();

    return record ? this.recordToDomain(record) : record;
  }

  protected recordToDomain(record: DeviceRecord): Device {
    return {
      id: record.id,
      slug: record.slug,
      friendlyName: record.friendly_name,
      aliases: record.aliases,
      room: record.room,
      category: record.category,
      readRoles: record.read_roles as Role[],
      writeRoles: record.write_roles as Role[],
      extraMetadata: record.extra_metadata,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: Device): DeviceRecord {
    return {
      id: domain.id,
      slug: domain.slug,
      friendly_name: domain.friendlyName,
      aliases: domain.aliases,
      room: domain.room,
      category: domain.category,
      read_roles: domain.readRoles,
      write_roles: domain.writeRoles,
      extra_metadata: domain.extraMetadata,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }
}