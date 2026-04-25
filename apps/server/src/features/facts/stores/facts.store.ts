// features/facts/facts.store.ts
import type { Knex } from 'knex';
import { AbstractEntityStore } from '../../../core/stores/abstract/abstract-entity.store';
import type { Fact } from '@home-ai/shared/domain/fact/fact';
import type { SearchCriteria } from '@home-ai/shared/search/search';
import { Paginated } from '@home-ai/shared/search/pagination';
import { AuditStore } from '../../../core/stores/audit/audit.store';
import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@home-ai/shared/domain/role/role';

export interface FactRecord {
  id: string;
  key: string;
  value: string;
  tags: string[];
  read_roles: string[];
  write_roles: string[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class FactsStore extends AbstractEntityStore<Fact, FactRecord> {
  constructor(@Inject('KNEX_CONNECTION') knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: 'facts', entityType: 'facts' });
  }

  async search(criteria: SearchCriteria): Promise<Paginated<Fact>> {
    return {
        items: [],
        total: 0,
        page: criteria.page,
        pageSize: criteria.pageSize,
        hasNext: false,
        hasPrevious: false,
      };
  }

  async getBySearch(search: string) {
    const searchToLower = search.toLocaleLowerCase();
    const searchLike = `%${search.toLowerCase()}%`;

    const records = await this.active.where((builder) => {
        builder
          .whereILike('key', searchLike)
          .orWhereILike('value', searchLike)
          .orWhereRaw('? = ANY(tags)', [searchToLower]);
      });

    return records.map(r => this.recordToDomain(r));
  }

  protected recordToDomain(record: FactRecord): Fact {
    return {
      id: record.id,
      key: record.key,
      value: record.value,
      tags: record.tags,
      readRoles: record.read_roles as Role[],
      writeRoles: record.write_roles as Role[],
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: Fact): FactRecord {
    return {
      id: domain.id,
      key: domain.key,
      value: domain.value,
      tags: domain.tags,
      read_roles: domain.readRoles,
      write_roles: domain.writeRoles,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  async getByKey(key: string) : Promise<Fact | undefined> {
    const record = await this.active.where('key', key).first();

    return record ? this.recordToDomain(record) : record;
  }

}