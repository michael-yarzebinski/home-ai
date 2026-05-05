// src/core/stores/tool/tool.store.ts
import type { Knex } from 'knex';
import { AbstractEntityStore } from '../abstract/abstract-entity.store';
import type { Tool, InsertableTool, UpdatableTool } from '@home-ai/shared/domain/tool/tool';
import { AuditStore } from '../audit/audit.store';
import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@home-ai/shared/domain/role/role';

export interface ToolRecord {
  id: string;
  name: string;
  friendly_name: string;
  hints?: string;
  request_roles: string[];
  write_roles: string[];
  notify_roles: string[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ToolStore extends AbstractEntityStore<Tool, ToolRecord, InsertableTool, UpdatableTool> {
  constructor(@Inject('KNEX_CONNECTION') knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: 'tools', entityType: 'tools' });
  }

  protected validateForRead(query: Knex.QueryBuilder): Knex.QueryBuilder {
    return query; // Admin-managed.
  }

  protected validateForWrite(query: Knex.QueryBuilder): Knex.QueryBuilder {
    return query;
  }

  protected applyTextSearch(query: Knex.QueryBuilder, search: string): Knex.QueryBuilder {
    const like = `%${search.toLowerCase()}%`;
    return query.where((b) =>
      b.whereILike('name', like).orWhereILike('friendly_name', like).orWhereILike('hints', like),
    );
  }

  protected recordToDomain(record: ToolRecord): Tool {
    return {
      id: record.id,
      name: record.name,
      friendlyName: record.friendly_name,
      requestRoles: record.request_roles as Role[],
      writeRoles: record.write_roles as Role[],
      notifyRoles: record.notify_roles as Role[],
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: Tool): ToolRecord {
    return {
      id: domain.id,
      name: domain.name,
      friendly_name: domain.friendlyName,
      hints: domain.hints,
      request_roles: domain.requestRoles,
      write_roles: domain.writeRoles,
      notify_roles: domain.notifyRoles,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  async getByName(name: string): Promise<Tool | undefined> {
    const record = await this.active.where('name', name).first();
    return record ? this.recordToDomain(record) : undefined
  }
}