import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { Log } from './log.domain';

export interface LogRecord {
    id: string;
    severity?: string;
    message?: string;
    data?: any;           // jsonb
    userId?: string;
  }

@Injectable()
export class LogStore {
  private readonly logger = new Logger(LogStore.name);

  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
  ) {}

  protected domainToRecord(domain: Partial<Log>): Partial<LogRecord> {
    return {
      severity: domain.severity,
      message: domain.message,
      data: domain.data,
      userId: domain.userId,
    };
  }

  protected recordToDomain(record: LogRecord): Log {
    return {
      id: record.id,
      severity: record.severity as any,
      message: record.message || '',
      data: record.data,
      userId: record.userId,
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

  async findAll(limit = 100): Promise<Log[]> {
    const records = await this.knex<LogRecord>('log')
      .orderBy('id', 'desc')
      .limit(limit);
    return records.map(r => this.recordToDomain(r));
  }
}