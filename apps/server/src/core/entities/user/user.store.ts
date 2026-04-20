import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from '../monitoring/audit/audit.service';
import { AbstractEntityStore } from '../abstract-entity.store';
import { KNEX_CONNECTION } from '../../database/knex.constants';
import { User } from './user.domain';

/**
 * DB Record for users table (snake_case). Only fields from service queries + schema.
 */
export interface UserRecord {
  id: string;
  name: string;
  role: string;
  messaging_id: string;
  access_code_hash: string;
  quiet_start?: string | null;
  quiet_end?: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

// src/users/user.store.ts
@Injectable()
export class UserStore extends AbstractEntityStore<UserRecord, User> {
  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
  ) {
    super(knex, auditService, {
      tableName: 'users',
      auditEntityType: 'User',
      hasUpdatedAt: true,
      hasActiveFlag: true,
    });
  }

  protected domainToRecord(domain: Partial<User>): Partial<UserRecord> {
    return {
      id: domain.id,
      name: domain.name,
      role: domain.role,
      messaging_id: domain.messagingId,
      quiet_start: domain.quietStart,
      quiet_end: domain.quietEnd,
      active: domain.active,
    };
  }

  protected recordToDomain(record: UserRecord): User {
    return {
      id: record.id,
      name: record.name,
      role: record.role,
      messagingId: record.messaging_id,
      quietStart: record.quiet_start ?? undefined,
      accessCodeHash: record.access_code_hash,
      quietEnd: record.quiet_end ?? undefined,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected searchQuery(search: string, query: Knex.QueryBuilder<UserRecord>): Knex.QueryBuilder<UserRecord> {
    const escaped = search.trim().replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const like = `%${escaped}%`;
  
    return query.andWhere(function () {
      this.whereRaw(`name ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`role ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`CAST(messaging_id AS text) ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`CAST(id AS text) ILIKE ? ESCAPE '\\'`, [like]);
    });
  }

  async getByUserIdOrMessagingId(value: string): Promise<User | null> {
    if (!value?.trim()) return null;
    const v = value.trim();
    const record = await this.knex<UserRecord>(this.tableName)
      .where((qb) => {
        qb.where('id', v).orWhere('messaging_id', v);
      })
      .first();
    return record ? this.recordToDomain(record) : null;
  }

  /**
   * Match login by display name (case-insensitive, trimmed).
   * Name is not guaranteed unique in the schema; callers must handle multiple matches.
   */
  async getByName(name: string): Promise<User | null> {
    const user = await this.activeOnly(this.baseQuery()).whereRaw('LOWER(TRIM(name)) = ?', [name.toLowerCase()]).first();
    if (!user) {
      return null;
    }
    return this.recordToDomain(user);
  }

  async getByRoles(roles: string[]) : Promise<User[]> {
    const records = await this.activeOnly(this.baseQuery())
      .whereIn('role', roles);

    return records.map((record) => this.recordToDomain(record));
  }
}