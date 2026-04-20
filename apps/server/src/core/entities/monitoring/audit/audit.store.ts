import { Inject, Injectable, Logger } from '@nestjs/common';
import { Knex } from 'knex';
import { v4 } from 'uuid';
import { Audit } from './audit.domain';
import { AbstractEntityStore } from '../../abstract-entity.store';
import { KNEX_CONNECTION } from '../../../database/knex.constants';

export interface AuditRecord {
    id: string;
    timestamp: Date;
    entity_type: string;
    entity_id: string;
    action: string;
    user_id?: string | null;
    changes?: any;
    metadata: Record<string, any>;
    notes?: string | null;
  }

@Injectable()
export class AuditStore extends AbstractEntityStore<AuditRecord, Audit> {
  private readonly logger = new Logger(AuditStore.name);

  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
  ) {
    super(knex, undefined, {
      tableName: 'audit',
      isAuditingEnabled: false,
    });
  }

  protected domainToRecord(domain: Partial<Audit>): Partial<AuditRecord> {
    return {
      id: domain.id,
      timestamp: domain.timestamp ?? new Date(),
      entity_type: domain.entityType,
      entity_id: domain.entityId,
      action: domain.action,
      user_id: domain.userId,
      changes: domain.changes,
      metadata: domain.metadata ?? {},
      notes: domain.notes,
    };
  }

  protected recordToDomain(record: AuditRecord): Audit {
    return {
      id: record.id,
      timestamp: record.timestamp,
      entityType: record.entity_type,
      entityId: record.entity_id,
      action: record.action,
      userId: record.user_id ?? undefined,
      changes: record.changes ?? undefined,
      metadata: record.metadata ?? {},
      notes: record.notes ?? undefined,
    };
  }

  async log(entry: Partial<Audit>): Promise<void> {
    try {
      await this.create({ ...entry, id: v4() });
      this.logger.debug(`Audited ${entry.action} on ${entry.entityType}:${entry.entityId}`);
    } catch (error) {
      this.logger.error(`Failed to log entity audit for ${entry.entityType}:${entry.entityId}`, error);
    }
  }

  async findForUser(userId: string, limit = 50): Promise<Audit[]> {
    const records = await this.baseQuery()
      .where('user_id', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    return records.map(record => this.recordToDomain(record));
  }

  async findByEntity(entityType: string, entityId: string | number): Promise<Audit[]> {
    const records = await this.baseQuery()
      .where('entity_type', entityType)
      .where('entity_id', String(entityId))
      .orderBy('timestamp', 'desc');

    return records.map(record => this.recordToDomain(record));
  }

  protected searchQuery(search: string, query: Knex.QueryBuilder<AuditRecord>): Knex.QueryBuilder<AuditRecord> {
    const escaped = search.trim().replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const like = `%${escaped}%`;

    return query.andWhere(function () {
      this.whereRaw(`entity_type ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`entity_id ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`action ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`COALESCE(notes, '') ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`CAST(user_id AS text) ILIKE ? ESCAPE '\\'`, [like]);
    });
    }
}