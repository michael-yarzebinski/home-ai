// core/stores/log/log.store.ts
import type { Knex } from "knex";
import { AbstractMonitoringStore } from "../abstract/abstract-monitoring.store";
import type { Log } from "@home-ai/shared/domain/monitoring/log/log";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Insertable } from "@home-ai/shared/common/crud.helper";

export interface LogRecord {
  id: string;
  user_id?: string;
  trace_id?: string;
  severity: string;
  message: string;
  metadata: any;
  created_at: Date;
}

@Injectable()
export class LogStore extends AbstractMonitoringStore<Log, LogRecord> {
  private logger = new Logger(LogStore.name);
  private readonly consoleOnly: boolean;

  constructor(
    @Inject("KNEX_CONNECTION") knex: Knex,
    configService: ConfigService,
  ) {
    super(knex, { tableName: "logs" });
    this.consoleOnly =
      configService.get<string>("LOG_TO_CONSOLE", "false").toLowerCase() ===
      "true";
  }

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    text: string,
  ): Knex.QueryBuilder {
    const like = `%${text}%`;
    return query.where((b) => {
      b.whereILike("message", like).orWhereILike("severity", like);
      if (isUuid(text)) {
        b.orWhere("trace_id", text);
      }
    });
  }

  protected recordToDomain(record: LogRecord): Log {
    return {
      id: record.id,
      userId: record.user_id,
      traceId: record.trace_id || undefined,
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
      trace_id: domain.traceId,
      severity: domain.severity,
      message: domain.message,
      metadata: domain.metadata,
      created_at: domain.createdAt,
    };
  }

  async findByTraceId(traceId: string): Promise<Log[]> {
    const records = (await this.table
      .where({ trace_id: traceId })
      .orderBy("created_at", "asc")) as LogRecord[];
    return records.map((r) => this.recordToDomain(r));
  }

  async create(log: Insertable<Log>): Promise<Log> {
    if (this.consoleOnly) {
      this.logger.log(log);
      return this.recordToDomain({
        id: "",
        user_id: log.userId,
        trace_id: log.traceId,
        severity: log.severity,
        message: log.message,
        metadata: log.metadata,
        created_at: new Date(),
      });
    }

    return super.create(log);
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
