import { Inject, Injectable, Logger } from '@nestjs/common';
import { Knex } from 'knex';
import { Log } from './log.domain';
import { AbstractEntityStore } from '../../abstract-entity.store';
import { KNEX_CONNECTION } from '../../../database/knex.constants';

export interface LogRecord {
  id: string;
  severity?: string;
  message?: string;
  data?: Record<string, any>;
  user_id?: string | null;
  created_at: Date;
}

@Injectable()
export class LogStore extends AbstractEntityStore<LogRecord, Log> {
  private readonly logger = new Logger(LogStore.name);

  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
  ) {
    super(knex, undefined, {
      tableName: 'log',
      isAuditingEnabled: false,
    });
  }

  protected domainToRecord(domain: Partial<Log>): Partial<LogRecord> {
    return {
      id: domain.id,
      severity: domain.severity,
      message: domain.message,
      data: domain.data,
      user_id: domain.userId,
    };
  }

  protected recordToDomain(record: LogRecord): Log {
    return {
      id: record.id,
      severity: record.severity ?? undefined,
      message: record.message ?? undefined,
      data: record.data ?? undefined,
      userId: record.user_id ?? undefined,
      createdAt: record.created_at,
    };
  }

  async log(entry: Partial<Log>): Promise<void> {
    try {
      await this.create(entry);
    } catch (error) {
      this.logger.error('Failed to write to log table', error);
    }
  }

  async findForUser(userId: string, limit = 100): Promise<Log[]> {
    const records = await this.baseQuery()
      .where('user_id', userId)
      .orderBy('id', 'desc')
      .limit(limit);
    return records.map(r => this.recordToDomain(r));
  }

  protected searchQuery(search: string, query: Knex.QueryBuilder<LogRecord>): Knex.QueryBuilder<LogRecord> {
    const escaped = search.trim().replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const like = `%${escaped}%`;
    return query.andWhere(function () {
      this.whereRaw(`message ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`severity ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`CAST(user_id AS text) ILIKE ? ESCAPE '\\'`, [like]);
    });
  }
}