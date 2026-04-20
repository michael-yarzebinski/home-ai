import { Inject, Injectable, Logger } from '@nestjs/common';
import { Knex } from 'knex';
import { AIAudit } from './ai-audit.domain';
import { AbstractEntityStore } from '../../abstract-entity.store';
import { KNEX_CONNECTION } from '../../../database/knex.constants';

export interface AIAuditRecord {
  id: string;
  timestamp: Date;
  event_type: string;
  user_id?: string | null;
  task_request_id?: string | null;
  task_name?: string | null;
  model?: string | null;
  model_input?: string | null;
  model_output?: string | null;
  latency_ms?: number | null;
  metadata: Record<string, any>;
  notes?: string | null;
}

@Injectable()
export class AIAuditStore extends AbstractEntityStore<AIAuditRecord, AIAudit> {
  private readonly logger = new Logger(AIAuditStore.name);

  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
  ) {
    super(knex, undefined, {
      tableName: 'ai_audit',
      isAuditingEnabled: false,
    });
  }

  protected domainToRecord(domain: Partial<AIAudit>): Partial<AIAuditRecord> {
    return {
      id: domain.id,
      timestamp: domain.timestamp ?? new Date(),
      event_type: domain.eventType,
      user_id: domain.userId,
      task_request_id: domain.taskRequestId,
      task_name: domain.taskName,
      model: domain.model,
      model_input: domain.modelInput,
      model_output: domain.modelOutput,
      latency_ms: domain.latencyMs,
      metadata: domain.metadata ?? {},
      notes: domain.notes,
    };
  }

  protected recordToDomain(record: AIAuditRecord): AIAudit {
    return {
      id: record.id,
      timestamp: record.timestamp,
      eventType: record.event_type,
      userId: record.user_id ?? undefined,
      taskRequestId: record.task_request_id ?? undefined,
      taskName: record.task_name ?? undefined,
      model: record.model ?? undefined,
      modelInput: record.model_input ?? undefined,
      modelOutput: record.model_output ?? undefined,
      latencyMs: record.latency_ms ?? undefined,
      metadata: record.metadata ?? {},
      notes: record.notes ?? undefined,
    };
  }

  /**
   * Log a new AI audit event (main usage)
   */
  async log(entry: Omit<AIAudit, 'id' | 'timestamp'>): Promise<void> {
    try {
      await this.create(entry);

      this.logger.debug(`AI Audit: ${entry.eventType} for task ${entry.taskName || 'unknown'}`);
    } catch (error) {
      this.logger.error(`Failed to log AI audit event: ${entry.eventType}`, error);
    }
  }

  /**
   * Find AI audits for a specific user
   */
  async findForUser(userId: string, limit = 50): Promise<AIAudit[]> {
    const records = await this.baseQuery()
      .where('user_id', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    return records.map(record => this.recordToDomain(record));
  }

  /**
   * Find AI audits related to a specific task request
   */
  async findForTaskRequest(taskRequestId: string, limit = 20): Promise<AIAudit[]> {
    const records = await this.baseQuery()
      .where('task_request_id', taskRequestId)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    return records.map(record => this.recordToDomain(record));
  }

  /**
   * Find AI audits by event type (e.g. 'task_detection', 'llm_call')
   */
  async findByEventType(eventType: string, limit = 50): Promise<AIAudit[]> {
    const records = await this.baseQuery()
      .where('event_type', eventType)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    return records.map(record => this.recordToDomain(record));
  }

  protected searchQuery(search: string, query: Knex.QueryBuilder<AIAuditRecord>): Knex.QueryBuilder<AIAuditRecord> {
    const escaped = search.trim().replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const like = `%${escaped}%`;

    return query.andWhere(function () {
      this.whereRaw(`event_type ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`COALESCE(task_name, '') ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`COALESCE(model, '') ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`COALESCE(notes, '') ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`CAST(user_id AS text) ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`CAST(task_request_id AS text) ILIKE ? ESCAPE '\\'`, [like]);
    });
  }

}