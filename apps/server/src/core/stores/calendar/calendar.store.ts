// core/stores/calendar/calendar.store.ts
import type { Knex } from 'knex';
import { AbstractEntityStore } from '../abstract/abstract-entity.store';
import type { Calendar } from '@home-ai/shared/domain/calendar/calendar';
import type { SearchCriteria } from '@home-ai/shared/search/search';
import { Paginated } from '@home-ai/shared/search/pagination';
import { AuditStore } from '../audit/audit.store';
import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@home-ai/shared/domain/role/role';

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
export class CalendarStore extends AbstractEntityStore<Calendar, CalendarRecord> {
  constructor(@Inject('KNEX_CONNECTION') knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: 'calendars', entityType: 'calendars' });
  }

  async search(criteria: SearchCriteria): Promise<Paginated<Calendar>> {
    // Basic implementation — expand as needed
    return {
      items: [],
      total: 0,
      page: criteria.page,
      pageSize: criteria.pageSize,
      hasNext: false,
      hasPrevious: false,
    };
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