// core/stores/ai-audit/ai-audit.store.ts
import type { Knex } from 'knex';
import { AbstractMonitoringStore } from '../abstract/abstract-monitoring.store';
import type { AIAudit } from '@home-ai/shared/domain/ai-audit/ai-audit';
import { Inject, Injectable } from '@nestjs/common';

export interface AIAuditRecord {
  id: string;
  user_id: string;
  chat_session_id?: string;
  user_message: string;
  tool_calls?: any;
  final_response?: string;
  duration_ms?: number;
  success: boolean;
  created_at: Date;
}

@Injectable()
export class AIAuditStore extends AbstractMonitoringStore<AIAudit, AIAuditRecord> {
  constructor(@Inject('KNEX_CONNECTION') knex: Knex,) {
    super(knex, { tableName: 'ai_audit' });
  }

  protected applyTextSearch(query: Knex.QueryBuilder, text: string): Knex.QueryBuilder {
    const like = `%${text}%`;
    return query.where((b) =>
      b.whereILike('user_message', like).orWhereILike('final_response', like),
    );
  }

  protected recordToDomain(record: AIAuditRecord): AIAudit {
    return {
      id: record.id,
      userId: record.user_id,
      chatSessionId: record.chat_session_id,
      userMessage: record.user_message,
      toolCalls: record.tool_calls,
      finalResponse: record.final_response,
      durationMs: record.duration_ms,
      success: record.success,
      createdAt: record.created_at,
    };
  }

  protected domainToRecord(domain: AIAudit): AIAuditRecord {
    return {
      id: domain.id,
      user_id: domain.userId,
      chat_session_id: domain.chatSessionId,
      user_message: domain.userMessage,
      tool_calls: domain.toolCalls ?? null,
      final_response: domain.finalResponse,
      duration_ms: domain.durationMs,
      success: domain.success,
      created_at: domain.createdAt,
    };
  }
}