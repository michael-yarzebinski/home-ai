// core/stores/log/log.store.ts
import type { Knex } from "knex";
import { AbstractMonitoringStore } from "../abstract/abstract-monitoring.store";
import type { Log } from "@home-ai/shared/domain/log/log";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Insertable } from "@home-ai/shared/common/crud.helper";

export interface LogRecord {
  id: string;
  user_id?: string;
  severity: string;
  message: string;
  metadata: any;
  created_at: Date;
}

@Injectable()
export class LogStore extends AbstractMonitoringStore<Log, LogRecord> {
  private logger = new Logger(LogStore.name);

  constructor(@Inject("KNEX_CONNECTION") knex: Knex) {
    super(knex, { tableName: "logs" });
  }

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    text: string,
  ): Knex.QueryBuilder {
    const like = `%${text}%`;
    return query.where((b) =>
      b.whereILike("message", like).orWhereILike("severity", like),
    );
  }

  protected recordToDomain(record: LogRecord): Log {
    return {
      id: record.id,
      userId: record.user_id,
      severity: record.severity,
      message: record.message,
      metadata: record.metadata,
      createdAt: record.created_at,
    };
  }

  protected domainToRecord(domain: Log): LogRecord {
    return {
      id: domain.id,
      user_id: domain.userId,
      severity: domain.severity,
      message: domain.message,
      metadata: domain.metadata,
      created_at: domain.createdAt,
    };
  }

  async create(log: Insertable<Log>): Promise<Log> {
    this.logger.log(log);
    return super.create(log);
  }
}
