// core/stores/note/note.store.ts
import type { Knex } from 'knex';
import { AbstractEntityStore } from '../abstract/abstract-entity.store';
import type { Note } from '@home-ai/shared/domain/note/note';
import { AuditStore } from '../audit/audit.store';
import { Paginated } from '@home-ai/shared/search/pagination';
import { SearchCriteria } from '@home-ai/shared/search/search';
import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@home-ai/shared/domain/role/role';

export interface NoteRecord {
  id: string;
  name: string;
  friendly_name: string;
  aliases: string[];
  read_roles: string[];
  write_roles: string[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class NoteStore extends AbstractEntityStore<Note, NoteRecord> {
  constructor(@Inject('KNEX_CONNECTION') knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: 'notes', entityType: 'notes' });
  }

  async search(criteria: SearchCriteria): Promise<Paginated<Note>> {
    return {
        items: [],
        total: 0,
        page: criteria.page,
        pageSize: criteria.pageSize,
        hasNext: false,
        hasPrevious: false,
      };
  }

  protected recordToDomain(record: NoteRecord): Note {
    return {
      id: record.id,
      name: record.name,
      friendlyName: record.friendly_name,
      aliases: record.aliases,
      readRoles: record.read_roles as Role[],
      writeRoles: record.write_roles as Role[],
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: Note): NoteRecord {
    return {
      id: domain.id,
      name: domain.name,
      friendly_name: domain.friendlyName,
      aliases: domain.aliases,
      read_roles: domain.readRoles,
      write_roles: domain.writeRoles,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }
}