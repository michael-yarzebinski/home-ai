import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { Log } from './log.domain';

export interface LogRecord {
  id: string;
  severity?: string;
  message?: string;
  data?: Record<string, any>;
  user_id?: string | null;
  created_at: Date;
}

@Injectable()
export class LogStore {
  private readonly logger = new Logger(LogStore.name);

  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
  ) {}

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
      const record = this.domainToRecord(entry);
      await this.knex('log').insert(record);
    } catch (error) {
      this.logger.error('Failed to write to log table', error);
    }
  }

  async findForUser(userId: string, limit = 100): Promise<Log[]> {
    const records = await this.knex<LogRecord>('log')
      .where('userId', userId)
      .orderBy('id', 'desc')
      .limit(limit);
    return records.map(r => this.recordToDomain(r));
  }

  async getAll(limit = 100): Promise<Log[]> {
    const records = await this.knex<LogRecord>('log')
      .orderBy('id', 'desc')
      .limit(limit);
    return records.map(r => this.recordToDomain(r));
  }
}