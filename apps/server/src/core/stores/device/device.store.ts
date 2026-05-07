import type { Knex } from "knex";
import {
  AbstractEntityStore,
  type RequestUser,
} from "../abstract/abstract-entity.store";
import type {
  Device,
  InsertableDevice,
  UpdatableDevice,
} from "@home-ai/shared/domain/device/device";

import { AuditStore } from "../monitoring/audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";
import { Role } from "@home-ai/shared/domain/role/role";

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
  is_time_sensitive: boolean;
  last_triggered_service: any | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class DeviceStore extends AbstractEntityStore<
  Device,
  DeviceRecord,
  InsertableDevice,
  UpdatableDevice
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: "devices", entityType: "devices" });
  }

  // ---------------------------------------------------------------------------
  // Row-level access control
  // ---------------------------------------------------------------------------

  protected validateForRead(
    query: Knex.QueryBuilder,
    user?: RequestUser,
  ): Knex.QueryBuilder {
    // No user = admin/internal context — sees all devices.
    if (!user) return query;
    // Regular users only see devices their role is allowed to read.
    return query.whereRaw("? = ANY(read_roles)", [user.role]);
  }

  protected validateForWrite(
    query: Knex.QueryBuilder,
    user?: RequestUser,
  ): Knex.QueryBuilder {
    // No user = admin/internal context — unrestricted.
    if (!user) return query;
    // Regular users can only mutate devices their role is allowed to write.
    return query.whereRaw("? = ANY(write_roles)", [user.role]);
  }

  // ---------------------------------------------------------------------------
  // Full-text search
  // ---------------------------------------------------------------------------

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    search: string,
  ): Knex.QueryBuilder {
    const like = `%${search.toLowerCase()}%`;
    return query.where((b) =>
      b
        .whereILike("slug", like)
        .orWhereILike("friendly_name", like)
        .orWhereILike("room", like)
        .orWhereILike("category", like)
        .orWhereRaw("? = ANY(aliases)", [search.toLowerCase()]),
    );
  }

  async getBySlug(slug: string): Promise<Device | undefined> {
    const record = await this.active.where("slug", slug).first();
    return record ? this.recordToDomain(record) : undefined;
  }

  // ---------------------------------------------------------------------------
  // Mapping
  // ---------------------------------------------------------------------------

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
      isTimeSensitive: record.is_time_sensitive,
      lastTriggeredService: record.last_triggered_service ?? undefined,
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
      is_time_sensitive: domain.isTimeSensitive,
      last_triggered_service: domain.lastTriggeredService ?? null,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }
}
