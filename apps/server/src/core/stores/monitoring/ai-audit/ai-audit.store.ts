// core/stores/ai-audit/ai-audit.store.ts
import type { Knex } from "knex";
import { AbstractMonitoringStore } from "../abstract/abstract-monitoring.store";
import type { AIAudit } from "@home-ai/shared/domain/monitoring/ai-audit/ai-audit";
import { Inject, Injectable } from "@nestjs/common";

export interface AIAuditRecord {
  id: string;
  user_id: string;
  trace_id?: string;
  chat_session_id?: string;
  user_message: string;
  tool_calls?: any;
  final_response?: string;
  duration_ms?: number;
  model?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  success: boolean;
  created_at: Date;
}

@Injectable()
export class AIAuditStore extends AbstractMonitoringStore<
  AIAudit,
  AIAuditRecord
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex) {
    super(knex, { tableName: "ai_audit" });
  }

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    text: string,
  ): Knex.QueryBuilder {
    const like = `%${text}%`;
    return query.where((b) => {
      b.whereILike("user_message", like).orWhereILike("final_response", like);
      if (isUuid(text)) {
        b.orWhere("trace_id", text);
      }
    });
  }

  protected recordToDomain(record: AIAuditRecord): AIAudit {
    return {
      id: record.id,
      userId: record.user_id,
      traceId: record.trace_id || undefined,
      chatSessionId: record.chat_session_id,
      userMessage: record.user_message,
      toolCalls: record.tool_calls,
      finalResponse: record.final_response,
      durationMs: record.duration_ms,
      model: record.model,
      promptTokens: record.prompt_tokens,
      completionTokens: record.completion_tokens,
      totalTokens: record.total_tokens,
      success: record.success,
      createdAt: record.created_at,
    };
  }

  protected domainToRecord(domain: AIAudit): AIAuditRecord {
    return {
      id: domain.id,
      user_id: domain.userId,
      trace_id: domain.traceId,
      chat_session_id: domain.chatSessionId,
      user_message: domain.userMessage,
      tool_calls: domain.toolCalls ?? null,
      final_response: domain.finalResponse,
      duration_ms: domain.durationMs,
      model: domain.model,
      prompt_tokens: domain.promptTokens,
      completion_tokens: domain.completionTokens,
      total_tokens: domain.totalTokens,
      success: domain.success,
      created_at: domain.createdAt,
    };
  }

  async findByTraceId(traceId: string): Promise<AIAudit[]> {
    const records = (await this.table
      .where({ trace_id: traceId })
      .orderBy("created_at", "asc")) as AIAuditRecord[];
    return records.map((r) => this.recordToDomain(r));
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
