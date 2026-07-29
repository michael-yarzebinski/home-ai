import type { Knex } from "knex";
import { AbstractEntityStore } from "../abstract/abstract-entity.store";
import type {
  DeviceEvent,
  InsertableDeviceEvent,
} from "@home-ai/shared/domain/device/device-event";
import type { SearchCriteriaBase } from "@home-ai/shared/search/search";
import { Paginated } from "@home-ai/shared/search/pagination";
import { AuditStore } from "../monitoring/audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";
import { AuthUser } from "../../auth/jwt.strategy";

export interface DeviceEventRecord {
  id: string;
  device_id: string;
  entity_id: string;
  old_state: string | null;
  new_state: string;
  metadata: any; // Postgres JSONB comes back as a string or object depending on driver
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class DeviceEventStore extends AbstractEntityStore<
  DeviceEvent,
  DeviceEventRecord,
  InsertableDeviceEvent
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, {
      tableName: "device_events",
      entityType: "device_events",
    });
  }

  protected validateUserForRead(
    query: Knex.QueryBuilder,
    user: AuthUser,
  ): Knex.QueryBuilder {
    return query.whereIn("device_id", (sub) => {
      sub
        .select("id")
        .from("devices")
        .where({ active: true })
        .whereRaw("read_roles @> jsonb_build_array(?::text)", [user.role]);
    });
  }

  protected validateUserForWrite(
    query: Knex.QueryBuilder,
    _user: AuthUser,
  ): Knex.QueryBuilder {
    return query;
  }

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    search: string,
  ): Knex.QueryBuilder {
    const like = `%${search.toLowerCase()}%`;
    return query.where((b) =>
      b.whereILike("device_id", like).orWhereILike("entity_id", like),
    );
  }

  protected recordToDomain(record: DeviceEventRecord): DeviceEvent {
    return {
      id: record.id,
      deviceId: record.device_id,
      entityId: record.entity_id,
      oldState: record.old_state,
      newState: record.new_state,
      metadata: record.metadata,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: DeviceEvent): DeviceEventRecord {
    return {
      id: domain.id,
      device_id: domain.deviceId,
      entity_id: domain.entityId,
      old_state: domain.oldState,
      new_state: domain.newState,
      metadata: domain.metadata,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  override async create(data: InsertableDeviceEvent): Promise<DeviceEvent> {
    const record = this.domainToRecord(data as any);
    const [inserted] = (await this.table
      .insert(record as any)
      .returning("*")) as DeviceEventRecord[];
    const domain = this.recordToDomain(inserted);

    await this.auditStore.create({
      entityType: this.entityType,
      entityId: domain.id,
      action: "create",
      changes: { old: null, new: inserted },
    });

    return domain;
  }

  async getByDeviceId(
    deviceId: string,
    criteria: SearchCriteriaBase,
    user: AuthUser,
  ): Promise<Paginated<DeviceEvent>> {
    let query = this.table;

    query = this.validateForRead(query, user);

    if (!criteria.includeInactive) {
      query = query.where({ active: true });
    }

    query = query.where({ device_id: deviceId });

    if (criteria.query?.trim()) {
      query = this.applyTextSearch(query, criteria.query.trim());
    }

    const countRow = (await query.clone().count("* as count").first()) as
      | { count: string }
      | undefined;
    const total = parseInt(countRow?.count ?? "0", 10);

    const offset = (criteria.page - 1) * criteria.pageSize;
    const records = (await query
      .orderBy(this.defaultOrder.column, this.defaultOrder.direction)
      .offset(offset)
      .limit(criteria.pageSize)) as DeviceEventRecord[];
    const items = records.map((r) => this.recordToDomain(r));

    return {
      items,
      total,
      page: criteria.page,
      pageSize: criteria.pageSize,
      hasNext: offset + items.length < total,
      hasPrevious: criteria.page > 1,
    };
  }
}
