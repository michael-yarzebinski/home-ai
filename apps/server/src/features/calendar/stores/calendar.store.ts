import type { Knex } from "knex";

import {
  AbstractEntityStore,
  type RequestUser,
} from "../../../core/stores/abstract/abstract-entity.store";
import type {
  Calendar,
  InsertableCalendar,
  UpdatableCalendar,
} from "@home-ai/shared/domain/calendar/calendar";
import { AuditStore } from "../../../core/stores/monitoring/audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";
import { Role } from "@home-ai/shared/domain/role/role";

export interface CalendarRecord {
  id: string;
  name: string;
  friendly_name: string;
  aliases: string[];
  read_roles: string[];
  write_roles: string[];
  color?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class CalendarStore extends AbstractEntityStore<
  Calendar,
  CalendarRecord,
  InsertableCalendar,
  UpdatableCalendar
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, {
      tableName: "calendars",
      entityType: "calendars",
    });
  }

  protected validateForRead(
    query: Knex.QueryBuilder,
    user?: RequestUser,
  ): Knex.QueryBuilder {
    if (!user) return query;
    return query.whereRaw("? = ANY(read_roles)", [user.role]);
  }

  protected validateForWrite(
    query: Knex.QueryBuilder,
    user?: RequestUser,
  ): Knex.QueryBuilder {
    if (!user) return query;
    return query.whereRaw("? = ANY(write_roles)", [user.role]);
  }

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    search: string,
  ): Knex.QueryBuilder {
    const like = `%${search.toLowerCase()}%`;
    return query.where((b) =>
      b.whereILike("name", like).orWhereILike("friendly_name", like),
    );
  }

  protected recordToDomain(record: CalendarRecord): Calendar {
    return {
      id: record.id,
      name: record.name,
      friendlyName: record.friendly_name,
      aliases: record.aliases,
      readRoles: record.read_roles as Role[],
      writeRoles: record.write_roles as Role[],
      color: record.color,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: Calendar): CalendarRecord {
    return {
      id: domain.id,
      name: domain.name,
      friendly_name: domain.friendlyName,
      aliases: domain.aliases,
      read_roles: domain.readRoles,
      write_roles: domain.writeRoles,
      color: domain.color,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }
}
