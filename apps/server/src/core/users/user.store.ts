import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from '../audit/audit.service';
import { AbstractEntityStore } from '../abstract-entity.store';
import { KNEX_CONNECTION } from '../database/knex.constants';
import { User } from './user.domain';

/**
 * DB Record for users table (snake_case). Only fields from service queries + schema.
 */
export interface UserRecord {
  id: string;
  name: string;
  role: string;
  messaging_id?: string;
  quiet_start?: string | null;
  quiet_end?: string | null;
  created_at?: Date;
}

@Injectable()
export class UserStore extends AbstractEntityStore<UserRecord, User> {
  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
  ) {
    super(knex, auditService, {
      tableName: 'users',
      auditEntityType: 'User',
      primaryKey: 'id',
    });
  }

  protected domainToRecord(domain: Partial<User>): Partial<UserRecord> {
    const record: Partial<UserRecord> = {};
    if (domain.id !== undefined) record.id = domain.id;
    if (domain.name !== undefined) record.name = domain.name;
    if (domain.role !== undefined) record.role = domain.role;
    if (domain.messagingId !== undefined) record.messaging_id = domain.messagingId;
    if (domain.quietStart !== undefined) record.quiet_start = domain.quietStart;
    if (domain.quietEnd !== undefined) record.quiet_end = domain.quietEnd;
    return record;
  }

  protected recordToDomain(record: UserRecord): User {
    return {
      id: record.id,
      name: record.name,
      role: record.role,
      messagingId: record.messaging_id,
      quietStart: record.quiet_start,
      quietEnd: record.quiet_end,
      createdAt: record.created_at,
    };
  }

  /**
   * Custom method matching existing service logic.
   */
  async findByUserIdOrHandle(value: string): Promise<User | null> {
    if (!value?.trim()) return null;
    const v = value.trim();
    const record = await this.knex<UserRecord>(this.tableName)
      .where((qb) => {
        qb.where('id', v).orWhere('messaging_id', v);
      })
      .first();
    return record ? this.recordToDomain(record) : null;
  }
}
